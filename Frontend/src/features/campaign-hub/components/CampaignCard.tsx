import React from 'react';
import styles from '@styles/CharacterCard.module.css';
import type { Campaign } from '../../../types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  onSelect: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onSelect }) => {
  const isActive = campaign.status === 'active';

  return (
    <div
      onClick={() => onSelect(campaign.id)}
      className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
    >
      <div
        className={styles.bgImage}
        style={{ backgroundImage: `url(${campaign.bgUrl})` }}
      >
        <div className={styles.gradientOverlay} />
      </div>

      <div className={styles.statusBadge}>
        {isActive ? (
          <span className={`${styles.statusBadge} ${styles.badgeActive}`}>
            ● Active Session
          </span>
        ) : (
          <span className={`${styles.statusBadge} ${styles.badgeCompleted}`}>
            Completed
          </span>
        )}
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>{campaign.title}</h2>
        <p className={styles.description}>{campaign.description}</p>

        <div className={styles.footer}>
          <span>
            {campaign.characters.length > 0
              ? `${campaign.characters.length} Players Connected`
              : 'Archive'}
          </span>
          <span className={styles.actionText}>Enter Overlay →</span>
        </div>
      </div>
    </div>
  );
};