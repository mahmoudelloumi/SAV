import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, UserPlus, Users, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input, Textarea, Select } from '../ui/Input.jsx';
import { creerInterventionStaff } from '../../api/interventionService.js';
import { getTousClients } from '../../api/utilisateurService.js';
import { ameliorerDescription, classifierProbleme } from '../../api/chatbotService.js';
import { PRIORITES, LIBELLES_PRIORITE, CATEGORIES, LIBELLES_CATEGORIE } from '../../constants/sav.js';

// Création d'une intervention par un employé/directeur : client existant ou nouveau.
// Le client recevra un code par e-mail pour confirmer l'intervention.
export default function CreerInterventionStaffModal({ open, onClose, onCree }) {
  const [mode, setMode] = useState('existant'); // 'existant' | 'nouveau'
  const [clients, setClients] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [clientId, setClientId] = useState('');

  const [nouveau, setNouveau] = useState({ raisonSociale: '', prenom: '', nom: '', email: '', telephone: '', matriculeFiscal: '' });
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState('NORMAL');
  const [categorie, setCategorie] = useState('AUTRE');

  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [amelioration, setAmelioration] = useState(false);
  const [classification, setClassification] = useState(false);
  const [classee, setClassee] = useState(false);   // true dès qu'une classification IA a réussi

  useEffect(() => {
    if (!open) return;
    getTousClients(0, 200).then((res) => setClients(res.data.content)).catch(() => setClients([]));
  }, [open]);

  const clientsFiltres = useMemo(() => {
    const q = recherche.toLowerCase();
    return clients.filter((c) =>
      !recherche ||
      c.raisonSociale?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      `${c.prenom || ''} ${c.nom || ''}`.toLowerCase().includes(q)
    );
  }, [clients, recherche]);

  function reset() {
    setMode('existant'); setClientId(''); setRecherche('');
    setNouveau({ raisonSociale: '', prenom: '', nom: '', email: '', telephone: '', matriculeFiscal: '' });
    setDescription(''); setPriorite('NORMAL'); setCategorie('AUTRE'); setErreur(''); setClassee(false);
  }

  function handleNouveau(e) {
    setNouveau({ ...nouveau, [e.target.name]: e.target.value });
  }

  // Reformule la description via l'assistant IA et remplace le texte dans le champ.
  async function ameliorer() {
    const texte = description.trim();
    if (!texte || amelioration) return;
    setErreur('');
    setAmelioration(true);
    try {
      const { data } = await ameliorerDescription(texte);
      if (data?.texte?.trim()) setDescription(data.texte.trim());
    } catch {
      setErreur("L'assistant est momentanément indisponible. Vous pouvez créer l'intervention telle quelle.");
    } finally {
      setAmelioration(false);
    }
  }

  // Classe automatiquement le problème : l'IA fixe la priorité et la catégorie.
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

    const payload = { description, priorite, categorie };
    if (mode === 'existant') {
      if (!clientId) { setErreur('Veuillez sélectionner un client.'); return; }
      payload.clientId = Number(clientId);
    } else {
      if (!nouveau.raisonSociale.trim() || !nouveau.email.trim()) {
        setErreur('La société et l\'email du client sont obligatoires.');
        return;
      }
      Object.assign(payload, nouveau);
    }

    setChargement(true);
    try {
      await creerInterventionStaff(payload);
      reset();
      onCree();
      onClose();
    } catch (err) {
      setErreur(err.response?.data?.message || "Création impossible.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle intervention" maxWidth="max-w-2xl">
      {erreur && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Choix du client */}
        <div className="flex gap-2">
          <ModeBtn active={mode === 'existant'} icon={Users} label="Client existant" onClick={() => setMode('existant')} />
          <ModeBtn active={mode === 'nouveau'} icon={UserPlus} label="Nouveau client" onClick={() => setMode('nouveau')} />
        </div>

        {mode === 'existant' ? (
          <div className="space-y-2">
            <Input label="Rechercher un client" placeholder="Société, contact ou email…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            <Select label="Client *" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {clientsFiltres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.raisonSociale} — {c.prenom} {c.nom} ({c.email})
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Société *" name="raisonSociale" value={nouveau.raisonSociale} onChange={handleNouveau} required />
            <Input label="Email *" type="email" name="email" value={nouveau.email} onChange={handleNouveau} required />
            <Input label="Prénom (contact)" name="prenom" value={nouveau.prenom} onChange={handleNouveau} />
            <Input label="Nom (contact)" name="nom" value={nouveau.nom} onChange={handleNouveau} />
            <Input label="Téléphone" name="telephone" value={nouveau.telephone} onChange={handleNouveau} />
            <Input label="Matricule fiscal" name="matriculeFiscal" value={nouveau.matriculeFiscal} onChange={handleNouveau} placeholder="ex : 1234567/A/M/000" />
          </div>
        )}

        {/* Intervention — description + bouton IA */}
        <div>
          <Textarea
            label="Description du problème"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            hint="Rédigez le problème, puis reformulez-le d'un clic avec l'assistant si vous le souhaitez."
            required
          />
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

        {/* Classification automatique : priorité + catégorie */}
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

        <p className="text-xs text-slate-400">
          Un code de confirmation sera envoyé par e-mail au client. L'intervention reste
          « en attente de confirmation » tant qu'il ne l'a pas validé.
        </p>

        <Button type="submit" loading={chargement} icon={PlusCircle} className="w-full">
          Créer l'intervention
        </Button>
      </form>
    </Modal>
  );
}

function ModeBtn({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-brand-500 bg-brand-500 text-white shadow-glow'
          : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-brand-400 hover:text-brand-500'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
