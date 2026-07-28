import type { SupabaseClient } from '@supabase/supabase-js';
import { withSupabase } from '@supabase/server/adapters/hono';
import { Hono } from 'hono';
import { z } from 'zod';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const TRANSFER_FILES_BUCKET = 'transfer-files';
const MAX_FILES_PER_TRANSFER = 10;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60;
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const SORTABLE_COLUMNS = {
    createdAt: 'created_at',
    shippedAt: 'shipped_at',
} as const;

type SortBy = keyof typeof SORTABLE_COLUMNS;
type SortOrder = 'asc' | 'desc';

interface TransferRow {
    id: number;
    created_at: string | null;
    shipped_at: string | null;
    transporter: string;
    receiver: string;
    container: string | null;
    price: number | string;
    cargo: string;
}

interface TransferFileRow {
    id: number;
    transfer_id: number;
    storage_path: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
}

interface Database {
    public: {
        Tables: {
            transfers: {
                Row: {
                    id: number;
                    created_at: string | null;
                    shipped_at: string | null;
                    transporter: string;
                    receiver: string;
                    container: string | null;
                    price: number;
                    cargo: string;
                };
                Insert: {
                    id?: number;
                    created_at?: string | null;
                    shipped_at?: string | null;
                    transporter: string;
                    receiver: string;
                    container?: string | null;
                    price: number;
                    cargo: string;
                };
                Update: {
                    id?: number;
                    created_at?: string | null;
                    shipped_at?: string | null;
                    transporter?: string;
                    receiver?: string;
                    container?: string | null;
                    price?: number;
                    cargo?: string;
                };
                Relationships: [];
            };
            transfer_files: {
                Row: {
                    id: number;
                    transfer_id: number;
                    storage_path: string;
                    original_name: string;
                    mime_type: string;
                    size_bytes: number;
                    created_at: string;
                };
                Insert: {
                    id?: number;
                    transfer_id: number;
                    storage_path: string;
                    original_name: string;
                    mime_type: string;
                    size_bytes: number;
                    created_at?: string;
                };
                Update: {
                    id?: number;
                    transfer_id?: number;
                    storage_path?: string;
                    original_name?: string;
                    mime_type?: string;
                    size_bytes?: number;
                    created_at?: string;
                };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

type TransferUpdate = Database['public']['Tables']['transfers']['Update'];

const createTransferSchema = z.object({
    createdAt: z.string().min(1).nullable().optional(),
    shippedAt: z.string().min(1).nullable().optional(),
    transporter: z.string().min(1),
    receiver: z.string().min(1),
    container: z.string().min(1).nullable().optional(),
    price: z.number().finite(),
    cargo: z.string().min(1),
});

const patchTransferSchema = createTransferSchema.partial();
const removedFileIdsSchema = z
    .array(z.number().int().positive())
    .refine(ids => new Set(ids).size === ids.length, 'Duplicate file ids are not allowed.');

function parsePositiveInt(value: string | undefined, fallback: number): number | null {
    if (value === undefined) {
        return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return null;
    }

    return parsed;
}

function parseOptionalNumber(value: string | undefined): number | null {
    if (value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return Number.NaN;
    }

    return parsed;
}

function sanitizeSearchQuery(query: string): string {
    return query
        .trim()
        .replaceAll(',', ' ')
        .replaceAll('(', '')
        .replaceAll(')', '');
}

function sanitizeFileName(fileName: string): string {
    const normalized = fileName.trim().replaceAll(/[^\w.-]/g, '_');
    if (normalized.length > 0) {
        return normalized;
    }

    return 'file';
}

function isMultipartRequest(contentType: string | undefined): boolean {
    return Boolean(contentType?.includes('multipart/form-data'));
}

function extractFilesFromFormData(formData: FormData): File[] {
    return formData
        .getAll('files')
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function parsePayloadFromFormData(formData: FormData, isRequired: boolean): unknown {
    const rawPayload = formData.get('payload');
    if (rawPayload === null && !isRequired) {
        return {};
    }

    if (typeof rawPayload !== 'string') {
        throw new TypeError('`payload` must be a JSON string.');
    }

    try {
        return JSON.parse(rawPayload) as unknown;
    }
    catch {
        throw new Error('`payload` must be valid JSON.');
    }
}

function parseRemovedFileIds(formData: FormData): number[] {
    const rawValue = formData.get('removedFileIds');
    if (rawValue === null) {
        return [];
    }

    if (typeof rawValue !== 'string') {
        throw new TypeError('`removedFileIds` must be a JSON array.');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawValue) as unknown;
    }
    catch {
        throw new Error('`removedFileIds` must be a valid JSON array.');
    }

    const validation = removedFileIdsSchema.safeParse(parsed);
    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message ?? 'Invalid `removedFileIds` value.');
    }

    return validation.data;
}

function validateUploadedFiles(files: File[]): string | null {
    if (files.length > MAX_FILES_PER_TRANSFER) {
        return `A transfer can include at most ${MAX_FILES_PER_TRANSFER} files.`;
    }

    for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return `File "${file.name}" exceeds the maximum size of 20MB.`;
        }
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return `File "${file.name}" has unsupported type "${file.type}".`;
        }
    }

    return null;
}

function buildStoragePath(transferId: number, originalName: string): string {
    return `transfers/${transferId}/${crypto.randomUUID()}-${sanitizeFileName(originalName)}`;
}

async function removeStorageFiles(supabaseAdmin: SupabaseClient<Database>, storagePaths: string[]): Promise<string | null> {
    if (storagePaths.length === 0) {
        return null;
    }

    const { error } = await supabaseAdmin
        .storage
        .from(TRANSFER_FILES_BUCKET)
        .remove(storagePaths);

    if (error) {
        return error.message;
    }

    return null;
}

async function uploadFilesAndInsertMetadata(
    supabaseAdmin: SupabaseClient<Database>,
    transferId: number,
    files: File[],
): Promise<{ errorMessage: string | null }> {
    if (files.length === 0) {
        return { errorMessage: null };
    }

    const uploadedPaths: string[] = [];
    const metadataRows: Database['public']['Tables']['transfer_files']['Insert'][] = [];

    for (const file of files) {
        const storagePath = buildStoragePath(transferId, file.name);
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        const { error: uploadError } = await supabaseAdmin
            .storage
            .from(TRANSFER_FILES_BUCKET)
            .upload(storagePath, fileBytes, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            const cleanupError = await removeStorageFiles(supabaseAdmin, uploadedPaths);
            const cleanupSuffix = cleanupError ? ` Cleanup failed: ${cleanupError}` : '';

            return {
                errorMessage: `Failed to upload file "${file.name}": ${uploadError.message}.${cleanupSuffix}`,
            };
        }

        uploadedPaths.push(storagePath);
        metadataRows.push({
            transfer_id: transferId,
            storage_path: storagePath,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
        });
    }

    const { error: insertError } = await supabaseAdmin
        .from('transfer_files')
        .insert(metadataRows);

    if (insertError) {
        const cleanupError = await removeStorageFiles(supabaseAdmin, uploadedPaths);
        const cleanupSuffix = cleanupError ? ` Cleanup failed: ${cleanupError}` : '';

        return {
            errorMessage: `Failed to save file metadata in Supabase: ${insertError.message}.${cleanupSuffix}`,
        };
    }

    return { errorMessage: null };
}

async function deleteFilesByIds(
    supabaseAdmin: SupabaseClient<Database>,
    transferId: number,
    removedFileIds: number[],
): Promise<{ status: 204 | 404 | 502; message?: string }> {
    if (removedFileIds.length === 0) {
        return { status: 204 };
    }

    const { data: rows, error: selectError } = await supabaseAdmin
        .from('transfer_files')
        .select('id, storage_path')
        .eq('transfer_id', transferId)
        .in('id', removedFileIds);

    if (selectError) {
        return {
            status: 502,
            message: `Failed to load files to delete from Supabase: ${selectError.message}`,
        };
    }

    if (!rows || rows.length !== removedFileIds.length) {
        return { status: 404, message: 'Some files were not found for this transfer.' };
    }

    const storagePaths = rows.map(row => row.storage_path);
    const storageDeleteError = await removeStorageFiles(supabaseAdmin, storagePaths);
    if (storageDeleteError) {
        return {
            status: 502,
            message: `Failed to delete files from storage: ${storageDeleteError}`,
        };
    }

    const { error: deleteError } = await supabaseAdmin
        .from('transfer_files')
        .delete()
        .eq('transfer_id', transferId)
        .in('id', removedFileIds);

    if (deleteError) {
        return {
            status: 502,
            message: `Failed to delete file metadata from Supabase: ${deleteError.message}`,
        };
    }

    return { status: 204 };
}

export const transfersRoute = new Hono();

transfersRoute.post('/transfers', withSupabase({ auth: 'none' }), async (c) => {
    const contentType = c.req.header('content-type');
    let rawBody: unknown;
    let files: File[] = [];

    if (isMultipartRequest(contentType)) {
        let formData: FormData;
        try {
            formData = await c.req.formData();
        }
        catch {
            return c.json({ message: 'Invalid multipart form data.' }, 400);
        }

        try {
            rawBody = parsePayloadFromFormData(formData, true);
        }
        catch (error) {
            return c.json({ message: (error as Error).message }, 400);
        }

        files = extractFilesFromFormData(formData);
    }
    else {
        try {
            rawBody = await c.req.json();
        }
        catch {
            return c.json({ message: 'Invalid JSON body.' }, 400);
        }
    }

    const filesValidationError = validateUploadedFiles(files);
    if (filesValidationError) {
        return c.json({ message: filesValidationError }, 400);
    }

    const parsedBody = createTransferSchema.safeParse(rawBody);
    if (!parsedBody.success) {
        return c.json({ message: parsedBody.error.issues[0]?.message ?? 'Invalid request body.' }, 400);
    }

    const body = parsedBody.data;
    const supabaseAdmin = c.var.supabaseContext.supabaseAdmin as SupabaseClient<Database>;
    const { data, error } = await supabaseAdmin
        .from('transfers')
        .insert({
            created_at: body.createdAt ?? null,
            shipped_at: body.shippedAt ?? null,
            transporter: body.transporter,
            receiver: body.receiver,
            container: body.container ?? null,
            price: body.price,
            cargo: body.cargo,
        })
        .select('id');

    if (error) {
        return c.json({ message: 'Failed to create transfer in Supabase.', details: error.message }, 502);
    }

    const transferId = data?.[0]?.id;
    const uploadResult = await uploadFilesAndInsertMetadata(supabaseAdmin, transferId, files);
    if (uploadResult.errorMessage) {
        await supabaseAdmin
            .from('transfers')
            .delete()
            .eq('id', transferId);

        return c.json({ message: uploadResult.errorMessage }, 502);
    }

    return c.body(null, 204);
});

transfersRoute.patch('/transfers/:id', withSupabase({ auth: 'none' }), async (c) => {
    const transferId = Number.parseInt(c.req.param('id'), 10);
    if (!Number.isFinite(transferId) || transferId < 1) {
        return c.json({ message: '`id` must be a positive integer.' }, 400);
    }

    const contentType = c.req.header('content-type');
    let rawBody: unknown = {};
    let files: File[] = [];
    let removedFileIds: number[] = [];

    if (isMultipartRequest(contentType)) {
        let formData: FormData;
        try {
            formData = await c.req.formData();
        }
        catch {
            return c.json({ message: 'Invalid multipart form data.' }, 400);
        }

        try {
            rawBody = parsePayloadFromFormData(formData, false);
            removedFileIds = parseRemovedFileIds(formData);
        }
        catch (error) {
            return c.json({ message: (error as Error).message }, 400);
        }

        files = extractFilesFromFormData(formData);
    }
    else {
        try {
            rawBody = await c.req.json();
        }
        catch {
            return c.json({ message: 'Invalid JSON body.' }, 400);
        }
    }

    const parsedBody = patchTransferSchema.safeParse(rawBody);
    if (!parsedBody.success) {
        return c.json({ message: parsedBody.error.issues[0]?.message ?? 'Invalid request body.' }, 400);
    }

    const body = parsedBody.data;
    const updatePayload: TransferUpdate = {};

    if (body.createdAt !== undefined) {
        updatePayload.created_at = body.createdAt;
    }
    if (body.shippedAt !== undefined) {
        updatePayload.shipped_at = body.shippedAt;
    }
    if (body.transporter !== undefined) {
        updatePayload.transporter = body.transporter;
    }
    if (body.receiver !== undefined) {
        updatePayload.receiver = body.receiver;
    }
    if (body.container !== undefined) {
        updatePayload.container = body.container;
    }
    if (body.price !== undefined) {
        updatePayload.price = body.price;
    }
    if (body.cargo !== undefined) {
        updatePayload.cargo = body.cargo;
    }

    const filesValidationError = validateUploadedFiles(files);
    if (filesValidationError) {
        return c.json({ message: filesValidationError }, 400);
    }

    const supabaseAdmin = c.var.supabaseContext.supabaseAdmin as SupabaseClient<Database>;
    const { data: existingTransfer, error: existingTransferError } = await supabaseAdmin
        .from('transfers')
        .select('id')
        .eq('id', transferId)
        .maybeSingle();

    if (existingTransferError) {
        return c.json({ message: 'Failed to update transfer in Supabase.', details: existingTransferError.message }, 502);
    }

    if (!existingTransfer) {
        return c.json({ message: 'Transfer not found' }, 404);
    }

    const { count: existingFilesCount, error: existingFilesCountError } = await supabaseAdmin
        .from('transfer_files')
        .select('id', { count: 'exact', head: true })
        .eq('transfer_id', transferId);

    if (existingFilesCountError) {
        return c.json({ message: 'Failed to count transfer files in Supabase.', details: existingFilesCountError.message }, 502);
    }

    const resultingFilesCount = (existingFilesCount ?? 0) - removedFileIds.length + files.length;
    if (resultingFilesCount > MAX_FILES_PER_TRANSFER) {
        return c.json({ message: `A transfer can include at most ${MAX_FILES_PER_TRANSFER} files.` }, 400);
    }

    if (Object.keys(updatePayload).length === 0) {
        const deleteResult = await deleteFilesByIds(supabaseAdmin, transferId, removedFileIds);
        if (deleteResult.status !== 204) {
            return c.json({ message: deleteResult.message }, deleteResult.status);
        }

        const uploadResult = await uploadFilesAndInsertMetadata(supabaseAdmin, transferId, files);
        if (uploadResult.errorMessage) {
            return c.json({ message: uploadResult.errorMessage }, 502);
        }

        return c.body(null, 204);
    }

    const { data: updatedTransfer, error } = await supabaseAdmin
        .from('transfers')
        .update(updatePayload)
        .eq('id', transferId)
        .select('id')
        .maybeSingle();

    if (error) {
        return c.json({ message: 'Failed to update transfer in Supabase.', details: error.message }, 502);
    }

    if (!updatedTransfer) {
        return c.json({ message: 'Transfer not found' }, 404);
    }

    const deleteResult = await deleteFilesByIds(supabaseAdmin, transferId, removedFileIds);
    if (deleteResult.status !== 204) {
        return c.json({ message: deleteResult.message }, deleteResult.status);
    }

    const uploadResult = await uploadFilesAndInsertMetadata(supabaseAdmin, transferId, files);
    if (uploadResult.errorMessage) {
        return c.json({ message: uploadResult.errorMessage }, 502);
    }

    return c.body(null, 204);
});

transfersRoute.get('/transfers/:id', withSupabase({ auth: 'none' }), async (c) => {
    const transferId = Number.parseInt(c.req.param('id'), 10);
    if (!Number.isFinite(transferId) || transferId < 1) {
        return c.json({ message: '`id` must be a positive integer.' }, 400);
    }

    const supabaseAdmin = c.var.supabaseContext.supabaseAdmin as SupabaseClient<Database>;
    const { data, error } = await supabaseAdmin
        .from('transfers')
        .select('id, created_at, shipped_at, transporter, receiver, container, price, cargo')
        .eq('id', transferId)
        .maybeSingle();

    if (error) {
        return c.json({ message: 'Failed to fetch transfer from Supabase.', details: error.message }, 502);
    }

    if (!data) {
        return c.json({ message: 'Transfer not found' }, 404);
    }

    const item: TransferRow = data;

    return c.json({
        id: item.id,
        createdAt: item.created_at,
        shippedAt: item.shipped_at,
        transporter: item.transporter,
        receiver: item.receiver,
        container: item.container,
        price: Number(item.price),
        cargo: item.cargo,
    });
});

transfersRoute.get('/transfers/:id/files', withSupabase({ auth: 'none' }), async (c) => {
    const transferId = Number.parseInt(c.req.param('id'), 10);
    if (!Number.isFinite(transferId) || transferId < 1) {
        return c.json({ message: '`id` must be a positive integer.' }, 400);
    }

    const supabaseAdmin = c.var.supabaseContext.supabaseAdmin as SupabaseClient<Database>;
    const { data: transfer, error: transferError } = await supabaseAdmin
        .from('transfers')
        .select('id')
        .eq('id', transferId)
        .maybeSingle();

    if (transferError) {
        return c.json({ message: 'Failed to fetch transfer from Supabase.', details: transferError.message }, 502);
    }

    if (!transfer) {
        return c.json({ message: 'Transfer not found' }, 404);
    }

    const { data: files, error: filesError } = await supabaseAdmin
        .from('transfer_files')
        .select('id, transfer_id, storage_path, original_name, mime_type, size_bytes, created_at')
        .eq('transfer_id', transferId)
        .order('created_at', { ascending: false });

    if (filesError) {
        return c.json({ message: 'Failed to fetch transfer files from Supabase.', details: filesError.message }, 502);
    }

    const responseFiles: Array<{
        id: number;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
        createdAt: string;
        downloadUrl: string;
    }> = [];

    for (const row of files ?? []) {
        const typedRow: TransferFileRow = row;
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
            .storage
            .from(TRANSFER_FILES_BUCKET)
            .createSignedUrl(typedRow.storage_path, SIGNED_URL_TTL_SECONDS);

        if (signedUrlError || !signedUrlData?.signedUrl) {
            return c.json({
                message: 'Failed to create signed URL for transfer file.',
                details: signedUrlError?.message ?? 'Signed URL is empty.',
            }, 502);
        }

        responseFiles.push({
            id: typedRow.id,
            originalName: typedRow.original_name,
            mimeType: typedRow.mime_type,
            sizeBytes: typedRow.size_bytes,
            createdAt: typedRow.created_at,
            downloadUrl: signedUrlData.signedUrl,
        });
    }

    return c.json(responseFiles);
});

transfersRoute.get('/transfers', withSupabase({ auth: 'none' }), async (c) => {
    const page = parsePositiveInt(c.req.query('page'), DEFAULT_PAGE);
    const requestedLimit = parsePositiveInt(c.req.query('limit'), DEFAULT_LIMIT);
    const sortBy = c.req.query('sortBy') ?? 'createdAt';
    const order = c.req.query('order') ?? 'desc';
    const priceMin = parseOptionalNumber(c.req.query('priceMin'));
    const priceMax = parseOptionalNumber(c.req.query('priceMax'));
    const rawSearchQuery = c.req.query('q');

    if (page === null) {
        return c.json({ message: '`page` must be a positive integer.' }, 400);
    }

    if (requestedLimit === null) {
        return c.json({ message: '`limit` must be a positive integer.' }, 400);
    }

    if (requestedLimit > MAX_LIMIT) {
        return c.json({ message: `\`limit\` must be less than or equal to ${MAX_LIMIT}.` }, 400);
    }

    if (!(sortBy in SORTABLE_COLUMNS)) {
        return c.json({ message: '`sortBy` must be one of: createdAt, shippedAt.' }, 400);
    }

    if (order !== 'asc' && order !== 'desc') {
        return c.json({ message: '`order` must be one of: asc, desc.' }, 400);
    }

    if (Number.isNaN(priceMin) || Number.isNaN(priceMax)) {
        return c.json({ message: '`priceMin` and `priceMax` must be valid numbers.' }, 400);
    }

    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
        return c.json({ message: '`priceMin` cannot be greater than `priceMax`.' }, 400);
    }

    const searchQuery = rawSearchQuery ? sanitizeSearchQuery(rawSearchQuery) : '';
    const sortColumn = SORTABLE_COLUMNS[sortBy as SortBy];
    const isAscending = (order as SortOrder) === 'asc';
    const from = (page - 1) * requestedLimit;
    const to = from + requestedLimit - 1;

    const supabaseAdmin = c.var.supabaseContext.supabaseAdmin as SupabaseClient<Database>;
    let query = supabaseAdmin
        .from('transfers')
        .select('id, created_at, shipped_at, transporter, receiver, container, price, cargo', { count: 'exact' })
        .order(sortColumn, { ascending: isAscending })
        .range(from, to);

    if (searchQuery.length > 0) {
        query = query.or(
            [
                `transporter.ilike.%${searchQuery}%`,
                `receiver.ilike.%${searchQuery}%`,
                `container.ilike.%${searchQuery}%`,
                `cargo.ilike.%${searchQuery}%`,
            ].join(','),
        );
    }

    if (priceMin !== null) {
        query = query.gte('price', priceMin);
    }

    if (priceMax !== null) {
        query = query.lte('price', priceMax);
    }

    const { data, error, count } = await query;

    if (error) {
        return c.json({ message: 'Failed to fetch transfers from Supabase.', details: error.message }, 502);
    }

    const items = (data ?? []).map((row: TransferRow) => ({
        id: row.id,
        createdAt: row.created_at,
        shippedAt: row.shipped_at,
        transporter: row.transporter,
        receiver: row.receiver,
        container: row.container,
        price: Number(row.price),
        cargo: row.cargo,
    }));

    const total = count ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / requestedLimit);

    return c.json({
        items,
        pagination: {
            page,
            limit: requestedLimit,
            total,
            totalPages,
        },
    });
});
