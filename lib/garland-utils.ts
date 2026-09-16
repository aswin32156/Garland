import { Garland } from '@/types';

export interface GarlandLike {
  name?: string;
  category?: { slug?: string; name?: string } | null;
  occasion?: { slug?: string; name?: string } | null;
  collection_tag?: string | null;
  category_id?: string | null;
  occasion_id?: string | null;
}

/**
 * Checks whether a garland belongs to the Wedding / Bridal category or occasion
 */
export function isWeddingGarland(garland?: GarlandLike | null): boolean {
  if (!garland) return false;

  const catSlug = (garland.category?.slug || '').toLowerCase();
  const catName = (garland.category?.name || '').toLowerCase();
  const occSlug = (garland.occasion?.slug || '').toLowerCase();
  const occName = (garland.occasion?.name || '').toLowerCase();
  const name = (garland.name || '').toLowerCase();
  const tag = (garland.collection_tag || '').toLowerCase();

  return (
    catSlug === 'wedding' ||
    catName.includes('wedding') ||
    occSlug === 'wedding' ||
    occName.includes('wedding') ||
    name.includes('wedding') ||
    name.includes('bridal') ||
    tag.includes('wedding')
  );
}

export interface GarlandPackagingInfo {
  isWedding: boolean;
  badgeLabel: string;
  badgeShort: string;
  unitLabel: string;
  piecesPerUnit: number;
  bannerTitle: string;
  bannerDesc: string;
  countHelpText: string;
  specValue: string;
  descriptionSnippet: string;
  getQuantitySummary: (qty: number) => string;
}

/**
 * Returns structured packaging information and quantity calculations for a garland
 */
export function getGarlandPackagingInfo(garland?: GarlandLike | null): GarlandPackagingInfo {
  const isWedding = isWeddingGarland(garland);

  if (isWedding) {
    return {
      isWedding: true,
      badgeLabel: '💍 1 Pair (2 Garlands)',
      badgeShort: '1 Pair (2 Pcs)',
      unitLabel: 'Pair (2 Garlands)',
      piecesPerUnit: 2,
      bannerTitle: '💍 Wedding Garland Set — Comes as 1 Pair (2 Garlands)',
      bannerDesc:
        'All wedding garlands are handcrafted and supplied as 1 Pair (2 matching garlands for Bride & Groom). Other garlands in our catalog come as single pieces. As required, you can increase the count for additional pairs.',
      countHelpText:
        '1 Unit = 1 Pair (2 Garlands — Bride & Groom). As required, you can increase the count for extra pairs.',
      specValue: '1 Pair (2 Garlands — Bride & Groom)',
      descriptionSnippet:
        '✨ Packaging Details: All wedding garlands come as 1 Pair (2 Garlands — Bride & Groom set). Others come as single pieces. As required, you can increase the count above.',
      getQuantitySummary: (qty: number) =>
        `${qty} Pair${qty > 1 ? 's' : ''} (${qty * 2} Garlands — Bride & Groom)`,
    };
  }

  return {
    isWedding: false,
    badgeLabel: '🌸 Single Garland (1 Pc)',
    badgeShort: 'Single (1 Pc)',
    unitLabel: 'Single (1 Pc)',
    piecesPerUnit: 1,
    bannerTitle: '🌸 Standard Garland — Comes as Single (1 Piece)',
    bannerDesc:
      'This garland is supplied as Single Garland (1 Piece). (Note: All wedding garlands come as a 2-garland pair). As required, you can increase the count for multiple garlands.',
    countHelpText:
      '1 Unit = 1 Garland. As required, you can increase the count for your pooja, temple, or event requirements.',
    specValue: 'Single Garland (1 Piece)',
    descriptionSnippet:
      '✨ Packaging Details: Comes as a Single Garland (1 Piece). (Note: Wedding garlands come as a 2-garland pair). As required, you can increase the count above.',
    getQuantitySummary: (qty: number) =>
      `${qty} Garland${qty > 1 ? 's' : ''} (${qty} Piece${qty > 1 ? 's' : ''})`,
  };
}
