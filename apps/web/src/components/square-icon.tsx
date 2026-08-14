import type { FC } from 'react';
import styles from './square-icon.module.css';

interface SquareIconProps {
    icon: React.ReactNode;
}

export const SquareIcon: FC<SquareIconProps> = ({
    icon,
}) => (
    <div className={styles.square_icon}>
        {icon}
    </div>
);
