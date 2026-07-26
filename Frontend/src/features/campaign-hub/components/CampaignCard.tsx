import React from "react";
import styles from '@styles/CampaignCard.module.css';
import type { Campaign } from "../../../types/campaign";

interface CampaignCardProps {
  campaign: Campaign;
  onSelect: (id: string) => void;
  onOpenEditModal: (campaign: Campaign) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onSelect,
  onOpenEditModal,
}) => {
  const isActive = campaign.status === "active";

  return (
    <div className={`${styles.card} ${isActive ? styles.activeCard : ""}`}>
      {/* תמונת רקע */}
      <div
        className={styles.bgImage}
        style={{ backgroundImage: `url(${campaign.bgUrl})` }}
      >
        <div className={styles.gradientOverlay} />
      </div>

      <div onClick={() => onSelect(campaign.id)} className={styles.content}>
        {/* 1. Header: Badge סטטוס */}
        <div className={styles.header}>
          <div>
            {isActive ? (
              <span className={styles.statusActive}>
                <span className={styles.dotActive} />
                Active Session
              </span>
            ) : (
              <span className={styles.statusCompleted}>
                <span className={styles.dotCompleted} />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* 2. תוכן מרכזי */}
        <div className={styles.bodyContent}>
          <h2 className={styles.title}>{campaign.title}</h2>

          {campaign.description && (
            <p className={styles.description}>{campaign.description}</p>
          )}
        </div>

        {/* 3. Footer */}
        <div className={styles.footer}>
          <span className={styles.playersText}>
            👥{" "}
            {campaign.characters?.length > 0
              ? `${campaign.characters.length} Players Connected`
              : "Archive"}
          </span>

          <div className={styles.footerRight}>
            <span className={styles.actionText}>Enter Overlay →</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditModal(campaign);
              }}
              className={styles.editButton}
              title="ערוך קמפיין"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};