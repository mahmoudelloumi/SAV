import { useEffect, useRef, useState } from 'react';
import {
  UserCog2, XCircle, ArrowUpDown, FileText, Wallet, CheckCircle2, Flag, Hand, Paperclip, Mail, Check, Pause, Clock, Sparkles,
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Select, Textarea, Input } from '../ui/Input.jsx';
import { PrioriteBadge } from '../ui/Badge.jsx';
import { getTousEmployes } from '../../api/utilisateurService.js';
import {
  affecterIntervention, modifierPriorite, annulerIntervention,
  prendreEnCharge, accepterIntervention, changerEtat, ajouterRapport, modifierPrix, cloturerIntervention,
  getPiecesJointes, getContenuPieceJointe, envoyerRapport, confirmerIntervention, renvoyerCodeConfirmation,
  suggererTechnicien,
} from '../../api/interventionService.js';
import { genererRapport } from '../../api/chatbotService.js';
import { PRIORITES, LIBELLES_PRIORITE, TRANSITIONS_AUTORISEES, LIBELLES_ETAT, LIBELLES_CATEGORIE } from '../../constants/sav.js';

// ============================================================
// Détail complet d'une intervention + actions contextuelles selon le
// rôle de l'utilisateur et l'état courant. Les formulaires d'action
// s'affichent en accordéon pour ne pas surcharger visuellement la modale.
// ============================================================

export default function InterventionDetailModal({ intervention, role, open, onClose, onUpdated }) {
  const [section, setSection] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoiRapport, setEnvoiRapport] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');
  const [codeSaisi, setCodeSaisi] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const [erreurConfirmation, setErreurConfirmation] = useState('');
  const formulaireRef = useRef(null);

  useEffect(() => {
    setSection(null);
    setErreur('');
    setMessageSucces('');
    setCodeSaisi('');
    setErreurConfirmation('');
  }, [intervention?.id]);

  // Fait défiler automatiquement vers le formulaire qui vient d'être ouvert.
  useEffect(() => {
    if (section && formulaireRef.current) {
      formulaireRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [section]);

  if (!intervention) return null;
  const { id, code, description, priorite, etat, categorie, rapportTechnique, prixEstime, prixFinal, confirmee,
    clientNom, clientRaisonSociale, employeAffecteNom, employeAffecteId, dateCreation, dateCloture } = intervention;

  const transitionsPossibles = TRANSITIONS_AUTORISEES[etat] || [];
  // La terminaison passe exclusivement par le bouton « Clôturer » (rapport + prix
  // obligatoires) : on ne propose donc jamais « Terminée » dans le menu d'état.
  const optionsChangementEtat = transitionsPossibles.filter((e) => e !== 'TERMINEE');

  async function executer(action) {
    setChargement(true);
    setErreur('');
    try {
      await action();
      onUpdated();
      setSection(null);
    } catch (err) {
      setErreur(err.response?.data?.message || "L'action a échoué.");
    } finally {
      setChargement(false);
    }
  }

  async function handleConfirmer() {
    if (!codeSaisi.trim()) { setErreurConfirmation('Saisissez le code de confirmation.'); return; }
    setConfirmation(true);
    setErreurConfirmation('');
    try {
      await confirmerIntervention(code, codeSaisi.trim());
      setCodeSaisi('');
      onUpdated();
    } catch (err) {
      setErreurConfirmation(err.response?.data?.message || 'Le code de confirmation est invalide.');
    } finally {
      setConfirmation(false);
    }
  }

  async function handleRenvoyerCode() {
    setErreurConfirmation('');
    setMessageSucces('');
    try {
      await renvoyerCodeConfirmation(id);
      setMessageSucces('Un nouveau code a été envoyé par e-mail au client.');
    } catch (err) {
      setErreurConfirmation(err.response?.data?.message || "Impossible de renvoyer le code.");
    }
  }

  async function handleEnvoyerRapport() {
    setEnvoiRapport(true);
    setErreur('');
    setMessageSucces('');
    try {
      await envoyerRapport(id);
      setMessageSucces('Rapport envoyé par e-mail au client.');
    } catch (err) {
      setErreur(err.response?.data?.message || "L'envoi du rapport a échoué.");
    } finally {
      setEnvoiRapport(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={code} maxWidth="max-w-xl">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Priorité :</span>
          <PrioriteBadge priorite={priorite} />
        </div>

        <div>
          <span className="text-xs font-medium text-slate-400">État :</span>
          <div className="mt-1.5">
            <PipelineEtat etat={etat} />
          </div>
        </div>

        {confirmee === false && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <Clock size={16} /> En attente de confirmation — un code a été envoyé au client par e-mail.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {role === 'CLIENT' ? 'Code reçu par e-mail' : 'Code communiqué par le client'}
                </label>
                <input
                  value={codeSaisi}
                  onChange={(e) => { setCodeSaisi(e.target.value.replace(/\D/g, '')); setErreurConfirmation(''); }}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="w-full rounded-xl border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-white/5 px-3 py-2 text-sm tracking-[0.3em] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <Button size="sm" loading={confirmation} onClick={handleConfirmer}>Confirmer</Button>
            </div>
            {erreurConfirmation && (
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{erreurConfirmation}</p>
            )}
            <button
              type="button"
              onClick={handleRenvoyerCode}
              className="mt-2 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              Renvoyer le code par e-mail
            </button>
          </div>
        )}

        <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Info label="Client" value={clientRaisonSociale || clientNom || '—'} />
          <Info label="Catégorie" value={LIBELLES_CATEGORIE[categorie] || '—'} />
          <Info label="Employé affecté" value={employeAffecteNom || 'Non affecté'} />
          <Info label="Créée le" value={formatDate(dateCreation)} />
          <Info label="Clôturée le" value={dateCloture ? formatDate(dateCloture) : '—'} />
          <Info label="Prix estimé" value={prixEstime ? `${prixEstime} DT` : '—'} />
          <Info label="Prix final" value={prixFinal ? `${prixFinal} DT` : '—'} />
        </dl>

        {rapportTechnique && (
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Rapport technique</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{rapportTechnique}</p>
          </div>
        )}

        <PiecesJointes interventionId={id} />

        {erreur && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
            {erreur}
          </div>
        )}

        {messageSucces && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
            {messageSucces}
          </div>
        )}

        {/* --- Actions Directeur (bloquées tant que l'intervention n'est pas confirmée) --- */}
        {role === 'DIRECTEUR' && confirmee !== false && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            {etat === 'NOUVELLE' && (
              <ActionToggle icon={UserCog2} label="Affecter" active={section === 'affecter'} onClick={() => setSection(section === 'affecter' ? null : 'affecter')} />
            )}
            <ActionToggle icon={Flag} label="Priorité" active={section === 'priorite'} onClick={() => setSection(section === 'priorite' ? null : 'priorite')} />
            {optionsChangementEtat.length > 0 && (
              <ActionToggle icon={ArrowUpDown} label="Changer l'état" active={section === 'etat'} onClick={() => setSection(section === 'etat' ? null : 'etat')} />
            )}
            {etat !== 'ANNULEE' && (
              <ActionToggle icon={Wallet} label="Prix" active={section === 'prix'} onClick={() => setSection(section === 'prix' ? null : 'prix')} />
            )}
            {etat !== 'TERMINEE' && etat !== 'ANNULEE' && (
              <ActionToggle icon={CheckCircle2} label="Clôturer" active={section === 'cloturer'} onClick={() => setSection(section === 'cloturer' ? null : 'cloturer')} />
            )}
            {transitionsPossibles.includes('ANNULEE') && (
              <ActionToggle icon={XCircle} label="Annuler" danger active={section === 'annuler'} onClick={() => setSection(section === 'annuler' ? null : 'annuler')} />
            )}
          </div>
        )}

        {/* --- Actions Employé (bloquées tant que l'intervention n'est pas confirmée) --- */}
        {role === 'EMPLOYE_SAV' && confirmee !== false && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            {etat === 'NOUVELLE' && !employeAffecteId ? (
              // Intervention du pool commun : seule action possible, se l'attribuer.
              <Button size="sm" icon={Hand} loading={chargement} onClick={() => executer(() => prendreEnCharge(id))}>
                Prendre en charge
              </Button>
            ) : (
              <>
                {etat === 'AFFECTEE' && (
                  <Button size="sm" icon={CheckCircle2} loading={chargement} onClick={() => executer(() => accepterIntervention(id))}>
                    Accepter
                  </Button>
                )}
                {optionsChangementEtat.length > 0 && (
                  <ActionToggle icon={ArrowUpDown} label="Changer l'état" active={section === 'etat'} onClick={() => setSection(section === 'etat' ? null : 'etat')} />
                )}
                <ActionToggle icon={FileText} label="Rapport" active={section === 'rapport'} onClick={() => setSection(section === 'rapport' ? null : 'rapport')} />
                <ActionToggle icon={Wallet} label="Prix" active={section === 'prix'} onClick={() => setSection(section === 'prix' ? null : 'prix')} />
                {etat === 'EN_COURS' && (
                  <ActionToggle icon={CheckCircle2} label="Clôturer" active={section === 'cloturer'} onClick={() => setSection(section === 'cloturer' ? null : 'cloturer')} />
                )}
              </>
            )}
          </div>
        )}

        {/* --- Formulaires (défilement auto à l'ouverture) --- */}
        <div ref={formulaireRef} className="scroll-mt-4">
          {section === 'affecter' && (
            <FormAffecter interventionId={id} chargement={chargement} onSubmit={(employeId) => executer(() => affecterIntervention(id, employeId))} />
          )}
          {section === 'priorite' && (
            <FormPriorite prioriteActuelle={priorite} chargement={chargement} onSubmit={(p) => executer(() => modifierPriorite(id, p))} />
          )}
          {section === 'annuler' && (
            <FormMotif chargement={chargement} label="Motif d'annulation" onSubmit={(motif) => executer(() => annulerIntervention(id, motif))} />
          )}
          {section === 'etat' && (
            <FormEtat options={optionsChangementEtat} chargement={chargement} onSubmit={(nouvelEtat, motif) => executer(() => changerEtat(id, nouvelEtat, motif))} />
          )}
          {section === 'rapport' && (
            <FormMotif chargement={chargement} label="Rapport technique" placeholder="Décrivez l'intervention réalisée…" onSubmit={(rapport) => executer(() => ajouterRapport(id, rapport))} />
          )}
          {section === 'prix' && (
            <FormPrix prixEstime={prixEstime} chargement={chargement} onSubmit={(pe) => executer(() => modifierPrix(id, pe || null, null))} />
          )}
          {section === 'cloturer' && (
            <FormCloture description={description} chargement={chargement} onSubmit={(rapport, prix) => executer(() => cloturerIntervention(id, rapport, prix))} />
          )}
        </div>

        {/* Envoi du rapport de clôture par e-mail — en dernier (intervention terminée) */}
        {etat === 'TERMINEE' && (role === 'DIRECTEUR' || role === 'EMPLOYE_SAV') && (
          <div className="pt-2 border-t border-slate-100 dark:border-white/10">
            <Button size="sm" variant="outline" icon={Mail} loading={envoiRapport} onClick={handleEnvoyerRapport} className="w-full">
              Envoyer le rapport par e-mail
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}

function ActionToggle({ icon: Icon, label, active, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsxToggle(active, danger)}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function clsxToggle(active, danger) {
  if (active) return 'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-brand-500 text-white shadow-glow';
  if (danger) return 'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10';
  return 'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600';
}

function FormAffecter({ interventionId, chargement, onSubmit }) {
  const [employes, setEmployes] = useState([]);
  const [employeId, setEmployeId] = useState('');
  const [suggestion, setSuggestion] = useState(null);   // { employeId, employeNom, raison, candidats }
  const [chargementIA, setChargementIA] = useState(false);
  const [erreurIA, setErreurIA] = useState('');

  useEffect(() => {
    getTousEmployes(0, 100).then((res) => setEmployes(res.data.content)).catch(() => {});
  }, []);

  // Affectation intelligente : l'IA propose le meilleur technicien (charge + historique).
  async function suggerer() {
    if (chargementIA) return;
    setErreurIA('');
    setChargementIA(true);
    try {
      const { data } = await suggererTechnicien(interventionId);
      setSuggestion(data);
      if (data.employeId) setEmployeId(String(data.employeId)); // pré-sélectionne le suggéré
    } catch (err) {
      setErreurIA(err.response?.data?.message || "Suggestion indisponible pour le moment.");
    } finally {
      setChargementIA(false);
    }
  }

  // Statistiques (charge/expérience) par technicien, issues de la suggestion IA.
  const statsParId = {};
  (suggestion?.candidats || []).forEach((c) => { statsParId[c.id] = c; });

  return (
    <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Choisir un technicien</label>
        <button
          type="button"
          onClick={suggerer}
          disabled={chargementIA}
          title="L'assistant suggère le meilleur technicien selon la charge et l'historique"
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-100 px-2.5 py-1
                     text-xs font-semibold text-brand-700 hover:bg-brand-200 disabled:opacity-40
                     dark:border-brand-500/60 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25 transition-colors"
        >
          <Sparkles size={14} className={chargementIA ? 'animate-pulse' : ''} />
          {chargementIA ? 'Analyse…' : 'Suggérer le meilleur'}
        </button>
      </div>

      {erreurIA && <p className="text-xs text-red-500">{erreurIA}</p>}

      {/* Recommandation de l'IA */}
      {suggestion?.employeId && (
        <div className="rounded-xl border border-brand-500/60 bg-brand-50 dark:bg-brand-500/10 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
            <Sparkles size={14} /> Suggestion : {suggestion.employeNom}
          </p>
          {suggestion.raison && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{suggestion.raison}</p>
          )}
        </div>
      )}

      <Select value={employeId} onChange={(e) => setEmployeId(e.target.value)}>
        <option value="">— Sélectionner —</option>
        {employes.map((e) => {
          const s = statsParId[e.id];
          const infoCharge = s ? ` — ${s.chargeActive} en cours, ${s.interventionsTerminees} traitées` : '';
          const marque = suggestion?.employeId === e.id ? '★ ' : '';
          return (
            <option key={e.id} value={e.id}>
              {marque}{e.prenom} {e.nom} ({e.specialite || 'Général'}){infoCharge}
            </option>
          );
        })}
      </Select>

      <Button size="sm" loading={chargement} disabled={!employeId} onClick={() => onSubmit(employeId)}>Confirmer l'affectation</Button>
    </div>
  );
}

function FormPriorite({ prioriteActuelle, chargement, onSubmit }) {
  const [valeur, setValeur] = useState(prioriteActuelle);
  return (
    <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <Select label="Nouvelle priorité" value={valeur} onChange={(e) => setValeur(e.target.value)}>
        {PRIORITES.map((p) => <option key={p} value={p}>{LIBELLES_PRIORITE[p]}</option>)}
      </Select>
      <Button size="sm" loading={chargement} onClick={() => onSubmit(valeur)}>Enregistrer</Button>
    </div>
  );
}

function FormMotif({ chargement, label, placeholder, onSubmit }) {
  const [texte, setTexte] = useState('');
  return (
    <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <Textarea label={label} placeholder={placeholder} rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} />
      <Button size="sm" loading={chargement} disabled={!texte.trim()} onClick={() => onSubmit(texte)}>Confirmer</Button>
    </div>
  );
}

function FormEtat({ options, chargement, onSubmit }) {
  const [nouvelEtat, setNouvelEtat] = useState(options[0] || '');
  const [motif, setMotif] = useState('');
  const motifRequis = nouvelEtat === 'EN_ATTENTE';

  return (
    <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <Select label="Nouvel état" value={nouvelEtat} onChange={(e) => setNouvelEtat(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{LIBELLES_ETAT[o]}</option>)}
      </Select>
      <Textarea
        label={`Motif${motifRequis ? ' *' : ' (optionnel)'}`}
        rows={2}
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
      />
      <Button size="sm" loading={chargement} disabled={motifRequis && !motif.trim()} onClick={() => onSubmit(nouvelEtat, motif)}>
        Confirmer
      </Button>
    </div>
  );
}

function FormPrix({ prixEstime, chargement, onSubmit }) {
  const [pe, setPe] = useState(prixEstime || '');
  return (
    <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <Input label="Prix estimé (DT)" type="number" step="1" value={pe} onChange={(e) => setPe(e.target.value)}
        hint="Le prix final se saisit à la clôture de l'intervention." />
      <Button size="sm" loading={chargement} onClick={() => onSubmit(pe)}>Enregistrer</Button>
    </div>
  );
}

function FormCloture({ description, chargement, onSubmit }) {
  const [rapport, setRapport] = useState('');
  const [prixFinal, setPrixFinal] = useState('');
  const [generation, setGeneration] = useState(false);
  const [erreurIA, setErreurIA] = useState('');

  // Génère le rapport technique final via l'assistant IA à partir du problème signalé
  // et des notes déjà saisies par le technicien. Le résultat remplit le champ (modifiable).
  async function genererAvecIA() {
    if (generation) return;
    setErreurIA('');
    setGeneration(true);
    try {
      const { data } = await genererRapport(description || '', rapport.trim());
      if (data?.texte?.trim()) setRapport(data.texte.trim());
    } catch {
      setErreurIA("L'assistant est momentanément indisponible.");
    } finally {
      setGeneration(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rapport technique final *</label>
          <button
            type="button"
            onClick={genererAvecIA}
            disabled={generation}
            title="Générer le rapport avec l'assistant (à partir du problème et de vos notes)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-100 px-2.5 py-1
                       text-xs font-semibold text-brand-700 hover:bg-brand-200 disabled:opacity-40
                       dark:border-brand-500/60 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25 transition-colors"
          >
            <Sparkles size={14} className={generation ? 'animate-pulse' : ''} />
            {generation ? 'Génération…' : 'Générer avec l\'assistant'}
          </button>
        </div>
        <Textarea rows={4} value={rapport} onChange={(e) => setRapport(e.target.value)}
          placeholder="Rédigez vos notes puis cliquez sur « Générer », ou écrivez directement le rapport." />
        {erreurIA && <p className="mt-1 text-xs text-red-500">{erreurIA}</p>}
      </div>
      <Input label="Prix final (DT) *" type="number" step="1" value={prixFinal} onChange={(e) => setPrixFinal(e.target.value)} />
      <Button size="sm" loading={chargement} disabled={!rapport.trim() || !prixFinal} onClick={() => onSubmit(rapport, prixFinal)}>
        Clôturer l'intervention
      </Button>
    </div>
  );
}

// Étapes principales du cycle de vie d'une intervention (pipeline).
const PIPELINE = ['NOUVELLE', 'AFFECTEE', 'ACCEPTEE', 'EN_COURS', 'TERMINEE'];

// Pipeline visuel de l'état : étapes franchies (✓), étape courante, étapes à venir.
// Cas particuliers : EN_ATTENTE (pause sur l'étape « En cours »), ANNULEE (terminal).
function PipelineEtat({ etat }) {
  if (etat === 'ANNULEE') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
        <XCircle size={18} /> Intervention annulée
      </div>
    );
  }

  const enPause = etat === 'EN_ATTENTE';
  const indexCourant = enPause ? PIPELINE.indexOf('EN_COURS') : PIPELINE.indexOf(etat);
  const termine = etat === 'TERMINEE';

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <div className="flex items-start overflow-x-auto py-1.5">
        {PIPELINE.map((e, i) => {
          const fait = i < indexCourant || (termine && i <= indexCourant);
          const courant = i === indexCourant && !fait;
          const enPauseIci = courant && enPause;

          return (
            <div key={e} className="flex flex-1 min-w-[64px] flex-col items-center">
              <div className="flex w-full items-center">
                {/* Connecteur gauche */}
                <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : fait || courant ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10'}`} />
                {/* Pastille */}
                <span
                  className={[
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
                    fait ? 'bg-brand-500 text-white' :
                    enPauseIci ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-400 dark:bg-amber-500/15' :
                    courant ? 'bg-white dark:bg-dark-card text-brand-600 ring-2 ring-brand-500' :
                    'bg-slate-200 dark:bg-white/10 text-slate-400',
                  ].join(' ')}
                >
                  {fait ? <Check size={16} /> : enPauseIci ? <Pause size={13} /> : i + 1}
                </span>
                {/* Connecteur droit */}
                <span className={`h-0.5 flex-1 ${i === PIPELINE.length - 1 ? 'opacity-0' : fait ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10'}`} />
              </div>
              <span className={`mt-1.5 text-center text-[11px] leading-tight ${
                courant ? 'font-semibold text-brand-600 dark:text-brand-400' :
                fait ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'
              }`}>
                {LIBELLES_ETAT[e]}
              </span>
            </div>
          );
        })}
      </div>
      {enPause && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Pause size={12} /> En attente — reprise nécessaire pour continuer
        </p>
      )}
    </div>
  );
}

// Galerie des photos envoyées par le client pour cette intervention.
function PiecesJointes({ interventionId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let annule = false;
    const urls = [];
    async function charger() {
      try {
        const { data } = await getPiecesJointes(interventionId);
        const avecUrl = await Promise.all(
          data.map(async (p) => {
            try {
              const res = await getContenuPieceJointe(p.id);
              const url = URL.createObjectURL(res.data);
              urls.push(url);
              return { ...p, url };
            } catch {
              return { ...p, url: null };
            }
          })
        );
        if (!annule) setItems(avecUrl);
      } catch {
        if (!annule) setItems([]);
      }
    }
    charger();
    return () => {
      annule = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [interventionId]);

  if (items.length === 0) return null;

  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
        <Paperclip size={13} /> Photos envoyées ({items.length})
      </p>
      <div className="flex flex-wrap gap-3">
        {items.map((p) => (
          <a
            key={p.id}
            href={p.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            title={p.nomFichier}
            className="relative block h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 hover:ring-2 hover:ring-brand-400 transition"
          >
            <ApercuPiece url={p.url} nom={p.nomFichier} />
          </a>
        ))}
      </div>
    </div>
  );
}

// Miniature avec repli si le format n'est pas affichable (ex. HEIC).
function ApercuPiece({ url, nom }) {
  const [erreur, setErreur] = useState(!url);
  const ext = (nom?.split('.').pop() || 'IMG').toUpperCase();

  if (erreur || !url) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 dark:bg-white/5 text-slate-400">
        <FileText size={18} />
        <span className="text-[9px] font-semibold">{ext}</span>
      </div>
    );
  }
  return <img src={url} alt={nom || 'Photo'} onError={() => setErreur(true)} className="h-full w-full object-cover" />;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
