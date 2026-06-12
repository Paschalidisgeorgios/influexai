"use client";

import { useTranslations } from "next-intl";
import type { ShowcaseItem } from "@/lib/landing-showcase-items";
import { ShowcaseAssetVisual } from "./ShowcaseAssetVisual";

type Props = {
  item: ShowcaseItem;
};

export function ShowcaseCard({ item }: Props) {
  const t = useTranslations("landingPage.campaignStudio.showcase.items");
  const ns = item.id;

  return (
    <article className="showcase-card group">
      <div className="showcase-card__visual">
        <ShowcaseAssetVisual variant={item.id} />
        <div className="showcase-card__badges">
          {item.badgeKeys.map((key) => (
            <span key={key} className="showcase-card__badge">
              {t(`${ns}.badges.${key}`)}
            </span>
          ))}
        </div>
      </div>
      <div className="showcase-card__body">
        <span className="showcase-card__tag">{t(`${ns}.tag`)}</span>
        <h3 className="showcase-card__title">{t(`${ns}.title`)}</h3>
        <p className="showcase-card__desc">{t(`${ns}.description`)}</p>
      </div>
    </article>
  );
}
