import { useEffect, useMemo, useRef, useState } from 'react';
import { PlusCircle, ImagePlus, X, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Textarea, Select } from '../ui/Input.jsx';
import { creerIntervention, ajouterPiecesJointes } from '../../api/interventionService.js';
import { ameliorerDescription, classifierProbleme } from '../../api/chatbotService.js';
import { PRIORITES, LIBELLES_PRIORITE, CATEGORIES, LIBELLES_CATEGORIE } from '../../constants/sav.js';

const MAX_PHOTOS = 5;
const TAILLE_MAX = 10 * 1024 * 1024; // 10 Mo

// Miniature d'aperçu : repli propre si le format n'est pas affichable (ex. HEIC).
function ApercuImage({ url, nom }) {
  const [erreur, setErreur] = useState(false);
  const ext = (nom?.split('.').pop() || 'img').toUpperCase();

  if (erreur) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 dark:bg-white/5 text-slate-400">
        <ImagePlus size={18} />
        <span className="text-[9px] font-semibold">{ext}</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={nom || 'Pièce jointe'}
      onError={() => setErreur(true)}
      className="h-full w-full object-cover"
    />
  );
}

// Formulaire de création d'une intervention (rôle CLIENT), en modale,
// avec possibilité de joindre des photos (upload ou prise de photo).
// `initial` (facultatif) : { description, priorite } pour pré-remplir le
// formulaire (utilisé par le chatbot IA).
export default function CreerInterventionModal({ open, onClose, onCree, initial = null }) {
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState('NORMAL');
  const [categorie, setCategorie] = useState('AUTRE');
  const [photos, setPhotos] = useState([]);      // File[]
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [amelioration, setAmelioration] = useState(false);
  const [classification, setClassification] = useState(false);
  const [classee, setClassee] = useState(false);   // true dès qu'une classification IA a réussi

  // Pré-remplit le formulaire à l'ouverture si des valeurs initiales sont fournies.
  useEffect(() => {
    if (open && initial) {
      setDescription(initial.description || '');
      setPriorite(initial.priorite || 'NORMAL');
      setCategorie(initial.categorie || 'AUTRE');
    }
  }, [open, initial]);

  const inputUpload = useRef(null);

  // Aperçus (object URLs) régénérés quand la liste de photos change.
  const apercus = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => apercus.forEach((url) => URL.revokeObjectURL(url)), [apercus]);

  function reset() {
    setDescription('');
    setPriorite('NORMAL');
    setCategorie('AUTRE');
    setPhotos([]);
    setErreur('');
    setClassee(false);
  }

  function ajouterFichiers(e) {
    const fichiers = Array.from(e.target.files || []);
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (fichiers.length === 0) return;

    // Les HEIC/HEIF ont parfois un type MIME vide selon le navigateur :
    // on accepte aussi par extension de fichier.
    const estImage = (f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name);
    const images = fichiers.filter(estImage);
    if (images.length !== fichiers.length) {
      setErreur('Seules les images sont acceptées.');
    }
    const tropGros = images.find((f) => f.size > TAILLE_MAX);
    if (tropGros) {
      setErreur(`"${tropGros.name}" dépasse 10 Mo.`);
      return;
    }

    setPhotos((prev) => {
      const combinees = [...prev, ...images].slice(0, MAX_PHOTOS);
      if (prev.length + images.length > MAX_PHOTOS) {
        setErreur(`Vous pouvez joindre au maximum ${MAX_PHOTOS} photos.`);
      } else {
        setErreur('');
      }
      return combinees;
    });
  }

  function retirerPhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // Reformule la description via l'assistant IA et remplace le texte dans le champ
  // (le client voit le résultat et peut encore le modifier avant de créer la demande).
  async function ameliorer() {
    const texte = description.trim();
    if (!texte || amelioration) return;
    setErreur('');
    setAmelioration(true);
    try {
      const { data } = await ameliorerDescription(texte);
      if (data?.texte?.trim()) setDescription(data.texte.trim());
    } catch {
      setErreur("L'assistant est momentanément indisponible. Vous pouvez créer la demande telle quelle.");
    } finally {
      setAmelioration(false);
    }
  }

  // Classe automatiquement le problème : l'IA fixe la priorité et la catégorie
  // d'après la description (le client peut ensuite ajuster).
  async function classer() {
    const texte = description.trim();
    if (!texte || classification) return;
    setErreur('');
    setClassification(true);
    try {
      const { data } = await classifierProbleme(texte);
      if (data?.priorite) setPriorite(data.priorite);
      if (data?.categorie) setCategorie(data.categorie);
      setClassee(true);
    } catch {
      setErreur("La classification automatique est momentanément indisponible. Choisissez manuellement.");
    } finally {
      setClassification(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      // La description est créée telle qu'affichée : le client l'a éventuellement
      // reformulée lui-même via le bouton « Améliorer avec l'assistant ».
      const { data } = await creerIntervention({ description: description.trim(), priorite, categorie });
      if (photos.length > 0 && data?.id) {
        await ajouterPiecesJointes(data.id, photos);
      }
      reset();
      onCree();
      onClose();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Création impossible.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle demande d'intervention">
      {erreur && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            label="Description du problème"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            hint="Rédigez votre problème, puis reformulez-le d'un clic avec l'assistant si vous le souhaitez."
            required
          />
          {/* Reformulation manuelle par l'assistant : le résultat s'affiche dans le champ ci-dessus. */}
          <button
            type="button"
            onClick={ameliorer}
            disabled={!description.trim() || amelioration}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-100 px-2.5 py-1.5
                       text-xs font-semibold text-brand-700 hover:bg-brand-200 disabled:opacity-40
                       dark:border-brand-500/60 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25 transition-colors"
          >
            <Sparkles size={14} className={amelioration ? 'animate-pulse' : ''} />
            {amelioration ? 'Reformulation…' : 'Améliorer avec l\'assistant'}
          </button>
        </div>
        {/* Classification automatique : l'IA fixe priorité + catégorie d'après la description. */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Priorité et catégorie</span>
            <button
              type="button"
              onClick={classer}
              disabled={!description.trim() || classification}
              title="L'assistant fixe automatiquement la priorité et la catégorie"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-100 px-2.5 py-1
                         text-xs font-semibold text-brand-700 hover:bg-brand-200 disabled:opacity-40
                         dark:border-brand-500/60 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25 transition-colors"
            >
              <Sparkles size={14} className={classification ? 'animate-pulse' : ''} />
              {classification ? 'Classification…' : 'Classer automatiquement'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
              {PRIORITES.map((p) => (
                <option key={p} value={p}>{LIBELLES_PRIORITE[p]}</option>
              ))}
            </Select>
            <Select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{LIBELLES_CATEGORIE[c]}</option>
              ))}
            </Select>
          </div>
          {classee && (
            <p className="mt-1 flex items-center gap-1 text-xs text-brand-600 dark:text-brand-300">
              <Sparkles size={12} /> Priorité et catégorie définies par l'assistant — ajustez-les si besoin.
            </p>
          )}
        </div>

        {/* Photos à joindre */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Photos du problème <span className="text-slate-400 font-normal">(facultatif, {MAX_PHOTOS} max)</span>
          </label>

          <div className="flex flex-wrap gap-3">
            {apercus.map((url, i) => (
              <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                <ApercuImage url={url} nom={photos[i]?.name} />
                <button
                  type="button"
                  onClick={() => retirerPhoto(i)}
                  className="absolute top-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Retirer la photo"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => inputUpload.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 dark:border-white/15 text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-[10px] font-medium text-center leading-tight">Ajouter / Photo</span>
              </button>
            )}
          </div>

          {/* Un seul champ : sur mobile le système propose « Appareil photo » ou « Photothèque ». */}
          <input
            ref={inputUpload}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            onChange={ajouterFichiers}
            className="hidden"
          />
        </div>

        <Button type="submit" loading={chargement} icon={PlusCircle} className="w-full">
          Créer la demande
        </Button>
      </form>
    </Modal>
  );
}
