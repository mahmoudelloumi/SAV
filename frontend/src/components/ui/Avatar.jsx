// Avatar à initiales, couleur déterministe selon le nom (pas d'image requise).
const PALETTE = [
  'bg-brand-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-pink-500', 'bg-amber-500', 'bg-cyan-500', 'bg-indigo-500',
];

function couleurPour(texte) {
  let hash = 0;
  for (const c of texte) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ nom = '', prenom = '', size = 'md', src = null }) {
  const initiales = `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase() || '?';
  const tailles = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };

  // Si une image est fournie, on l'affiche à la place des initiales.
  if (src) {
    return (
      <img
        src={src}
        alt={`${prenom} ${nom}`.trim() || 'Photo de profil'}
        className={`rounded-full object-cover shrink-0 ${tailles[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white shrink-0 ${tailles[size]} ${couleurPour(nom + prenom)}`}
    >
      {initiales}
    </div>
  );
}
