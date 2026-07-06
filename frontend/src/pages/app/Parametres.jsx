import { useRef, useState } from 'react';
import { Moon, Sun, ShieldCheck, User, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { LIBELLES_ROLE } from '../../constants/sav.js';
import { uploadPhotoProfil } from '../../api/utilisateurService.js';

export default function Parametres() {
  const { user, updateUser, photoUrl, rafraichirPhoto } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const inputFichier = useRef(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function onSelectionFichier(e) {
    const fichier = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (!fichier) return;

    if (!fichier.type.startsWith('image/')) {
      setErreur('Veuillez choisir une image (JPEG, PNG ou GIF).');
      return;
    }
    if (fichier.size > 10 * 1024 * 1024) {
      setErreur("L'image ne doit pas dépasser 10 Mo.");
      return;
    }

    setErreur('');
    setEnvoi(true);
    try {
      const { data } = await uploadPhotoProfil(fichier);
      updateUser({ photoProfilType: data.photoProfilType });
      // Recharge la photo partagée (visible aussi dans la barre supérieure).
      await rafraichirPhoto(user);
    } catch {
      setErreur("Échec de l'envoi de la photo. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gérez votre profil et vos préférences.</p>
      </div>

      {/* Profil — données réelles issues du compte connecté */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User size={18} /> Profil</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar nom={user.nom} prenom={user.prenom} size="lg" src={photoUrl} />
            <button
              type="button"
              onClick={() => inputFichier.current?.click()}
              disabled={envoi}
              title="Changer la photo de profil"
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow ring-2 ring-white dark:ring-dark-card disabled:opacity-60"
            >
              <Camera size={13} />
            </button>
            <input
              ref={inputFichier}
              type="file"
              accept="image/*"
              onChange={onSelectionFichier}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{user.prenom} {user.nom}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <p className="text-xs text-brand-500 font-medium mt-1">{LIBELLES_ROLE[user.role]}</p>
            {envoi && <p className="text-xs text-slate-400 mt-1">Envoi de la photo…</p>}
            {erreur && <p className="text-xs text-red-500 mt-1">{erreur}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Préférences — bascule de thème réellement fonctionnelle */}
      <Card>
        <CardHeader><CardTitle>Préférences d'affichage</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-3.5">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={18} className="text-brand-500" /> : <Sun size={18} className="text-brand-500" />}
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Thème {theme === 'dark' ? 'sombre' : 'clair'}</p>
                <p className="text-xs text-slate-400">Votre choix est mémorisé sur cet appareil.</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-full bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-glow"
            >
              Basculer
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité — aperçu, aucune action de désactivation réelle (endpoint non fourni) */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck size={18} /> Sécurité</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Double authentification (2FA)</p>
              <p className="text-xs text-slate-400">
                {user.twoFactorActive ? 'Activée sur votre compte.' : 'Configurée automatiquement lors de votre première connexion.'}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.twoFactorActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-white/10'}`}>
              {user.twoFactorActive ? 'Activée' : 'Non applicable'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
