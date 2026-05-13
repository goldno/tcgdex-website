export const ERAS = ['All', 'Mega Evolution', 'Scarlet & Violet', 'Sword & Shield', 'Sun & Moon', 'XY', 'Promos'];

export function getEra(setName) {
  if (!setName) return 'Mega Evolution';
  const n = setName.toLowerCase();

  // Promos — check first so "SV: Scarlet & Violet Promo Cards" etc. don't match their era
  if (n.includes('promo') || n.includes('alternate art')) return 'Promos';

  // Mega Evolution era (newest — post Scarlet & Violet)
  if (
    n.startsWith('me0') || n.startsWith('me:') || n.startsWith('me ') ||
    n.includes('phantasmal flames') || n.includes('ascended heroes') ||
    n.includes('perfect order') || n.includes('chaos rising')
  ) return 'Mega Evolution';

  // Scarlet & Violet
  if (
    n.includes('scarlet') || n.includes('violet') || n.includes('paldea') ||
    n.includes('obsidian flames') || n.includes('paradox rift') ||
    n.includes('temporal forces') || n.includes('twilight masquerade') ||
    n.includes('shrouded fable') || n.includes('stellar crown') ||
    n.includes('surging sparks') || n.includes('prismatic') ||
    n.includes('journey together') || n.includes('destined rivals') ||
    n.includes('black bolt') || n.includes('white flare') ||
    /\b151\b/.test(n) ||
    n.startsWith('sv') || n.includes('paldean')
  ) return 'Scarlet & Violet';

  // Sword & Shield
  if (
    n.includes('sword') || n.includes('shield') || n.includes('rebel clash') ||
    n.includes('darkness ablaze') || n.includes('champion') ||
    n.includes('vivid voltage') || n.includes('shining fates') ||
    n.includes('battle styles') || n.includes('chilling reign') ||
    n.includes('evolving skies') || n.includes('fusion strike') ||
    n.includes('brilliant stars') || n.includes('astral radiance') ||
    n.includes('lost origin') || n.includes('silver tempest') ||
    n.includes('crown zenith') || n.includes('celebration') ||
    n.startsWith('swsh') ||
    n.includes('pokémon go') || n.includes('pokemon go')
  ) return 'Sword & Shield';

  // Sun & Moon
  if (
    n.includes('sun') || n.includes('moon') || n.includes('guardians rising') ||
    n.includes('burning shadows') || n.includes('shining legends') ||
    n.includes('crimson invasion') || n.includes('ultra prism') ||
    n.includes('forbidden light') || n.includes('celestial storm') ||
    n.includes('dragon majesty') || n.includes('lost thunder') ||
    n.includes('team up') || n.includes('unbroken bonds') ||
    n.includes('unified minds') || n.includes('hidden fates') ||
    n.includes('cosmic eclipse') ||
    n.startsWith('sm')
  ) return 'Sun & Moon';

  // XY
  if (
    n.startsWith('xy') || n.includes('flashfire') || n.includes('furious fists') ||
    n.includes('phantom forces') || n.includes('primal clash') ||
    n.includes('roaring skies') || n.includes('ancient origins') ||
    n.includes('breakthrough') || n.includes('breakpoint') ||
    n.includes('fates collide') || n.includes('steam siege') ||
    n.includes('generations') || n.includes('double crisis') ||
    n.includes('evolutions')
  ) return 'XY';

  return 'Mega Evolution';
}
