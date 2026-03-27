import React from 'react';
import '../styles/skeletons.css';

export const Skeleton = ({ className }) => (
    <div className={`skeleton ${className}`}></div>
);

export const DirectorySkeleton = () => (
    <div className="admin-skeleton-page">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="directory-skeleton-item">
                <Skeleton className="skeleton-circle" style={{ width: 28, height: 28 }} />
                <Skeleton className="skeleton-text" style={{ width: '40%', height: 16, marginBottom: 0 }} />
            </div>
        ))}
    </div>
);

export const UserCardSkeleton = () => (
    <div className="user-management-card skeleton-container">
        <div className="card-top">
            <Skeleton className="skeleton-circle user-card-avatar" style={{ border: 'none' }} />
        </div>
        <div className="card-info">
            <Skeleton className="skeleton-title" style={{ height: 18, marginBottom: 8 }} />
            <Skeleton className="skeleton-text" style={{ width: '80%', height: 12 }} />
            <div className="u-badges">
                <Skeleton className="u-tag" style={{ width: 60, height: 18, borderRadius: 6 }} />
            </div>
        </div>
    </div>
);

export const ExplorerCardSkeleton = () => (
    <div className="explorer-card skeleton-container" style={{ cursor: 'default' }}>
        <Skeleton className="skeleton-circle card-icon" style={{ width: 40, height: 40, marginBottom: 16 }} />
        <div className="card-info">
            <Skeleton className="skeleton-title" style={{ height: 18, width: '70%' }} />
            <Skeleton className="skeleton-text" style={{ height: 12, width: '50%' }} />
        </div>
    </div>
);

export const AdminPageSkeleton = ({ type = 'list' }) => {
    return (
        <div className="admin-skeleton-page" style={{ padding: 0 }}>
            {type === 'grid' ? (
                <div className="explorer-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => <ExplorerCardSkeleton key={i} />)}
                </div>
            ) : (
                <div className="user-directory-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <UserCardSkeleton key={i} />)}
                </div>
            )}
        </div>
    );
};

export const ListItemSkeleton = ({ count = 4 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px' }}>
                <Skeleton className="skeleton-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <Skeleton className="skeleton-text" style={{ width: `${55 + (i * 10) % 30}%`, height: 14, marginBottom: 6 }} />
                    <Skeleton className="skeleton-text" style={{ width: '35%', height: 10, marginBottom: 0 }} />
                </div>
            </div>
        ))}
    </div>
);
