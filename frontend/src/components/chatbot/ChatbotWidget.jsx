import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, PlusCircle, Sparkles, RotateCcw } from 'lucide-react';
import { envoyerMessageChatbot } from '../../api/chatbotService.js';
import CreerInterventionModal from '../interventions/CreerInterventionModal.jsx';

// Contact WhatsApp rapide du SAV.
const WHATSAPP_NUMERO = '21652316703';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Bonjour, j\'ai besoin d\'aide concernant mon service SAV.')}`;

// Logo WhatsApp (SVG) — lucide n'a pas d'icône de marque.
function IconeWhatsApp({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ============================================================
// Widget de chat flottant (rôle CLIENT) : assistant SAV basé sur
// une IA locale (Ollama). Peut proposer la création d'une demande
// d'intervention pré-remplie à partir de la conversation.
// ============================================================

const MESSAGE_ACCUEIL = {
  role: 'assistant',
  content:
    "Bonjour ! Je suis l'assistant SAV. Décrivez-moi votre problème : "
    + "je vais essayer de vous aider, et si besoin je créerai une demande d'intervention pour vous.",
};

export default function ChatbotWidget() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([MESSAGE_ACCUEIL]);
  const [saisie, setSaisie] = useState('');
  const [chargement, setChargement] = useState(false);
  const [attenteLongue, setAttenteLongue] = useState(false);
  // Suggestion utilisée pour pré-remplir la modale (au clic sur un bouton de message).
  const [suggestionActive, setSuggestionActive] = useState(null);
  const [modalCreation, setModalCreation] = useState(false);

  const finListe = useRef(null);
  const champSaisie = useRef(null);
  const panneauRef = useRef(null);
  const bulleRef = useRef(null);

  // Défilement auto vers le dernier message.
  useEffect(() => {
    finListe.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chargement, attenteLongue]);

  // Clic en dehors du chatbot : on FERME le panneau (sans réinitialiser la conversation),
  // pour libérer les boutons de la page (déconnexion, pagination…) qu'il pourrait recouvrir.
  useEffect(() => {
    if (!ouvert) return;
    function fermerSiExterieur(e) {
      if (panneauRef.current && !panneauRef.current.contains(e.target)
          && bulleRef.current && !bulleRef.current.contains(e.target)) {
        setOuvert(false);
      }
    }
    document.addEventListener('mousedown', fermerSiExterieur);
    return () => document.removeEventListener('mousedown', fermerSiExterieur);
  }, [ouvert]);

  // Après 2,5 s d'attente, on affiche un petit message rassurant.
  useEffect(() => {
    if (!chargement) { setAttenteLongue(false); return; }
    const t = setTimeout(() => setAttenteLongue(true), 2500);
    return () => clearTimeout(t);
  }, [chargement]);

  useEffect(() => {
    if (ouvert) champSaisie.current?.focus();
  }, [ouvert]);

  async function envoyer(e) {
    e?.preventDefault();
    const texte = saisie.trim();
    if (!texte || chargement) return;

    const historique = messages
      .filter((m) => m !== MESSAGE_ACCUEIL)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: 'user', content: texte }]);
    setSaisie('');
    setChargement(true);

    try {
      const { data } = await envoyerMessageChatbot(texte, historique);
      // Le bouton « Créer cette demande » est attaché au message du chatbot dès qu'il
      // propose une intervention (flag du modèle OU mention dans le texte).
      const proposeIntervention = data.creerIntervention
        || /demande d[’']intervention|cr[ée]er une (demande|intervention)/i.test(data.reponse || '');
      const suggestion = proposeIntervention
        ? { description: data.suggestionDescription || texte, priorite: data.suggestionPriorite || 'NORMAL' }
        : null;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reponse, suggestion }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Désolé, je n'arrive pas à répondre pour le moment. "
            + 'Vous pouvez créer directement une demande depuis la page Interventions.',
        },
      ]);
    } finally {
      setChargement(false);
    }
  }

  // Réinitialise la conversation (nouveau sujet) : efface l'historique et la suggestion.
  function reinitialiser() {
    setMessages([MESSAGE_ACCUEIL]);
    setSaisie('');
    champSaisie.current?.focus();
  }

  // Ouvre la modale de création, pré-remplie avec la suggestion du message cliqué.
  function ouvrirCreation(suggestion) {
    setSuggestionActive(suggestion || null);
    setModalCreation(true);
  }

  return (
    <>
      {/* --- Bulle flottante --- */}
      <button
        ref={bulleRef}
        onClick={() => setOuvert((o) => !o)}
        aria-label="Assistant SAV"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full
                   bg-brand-600 text-white shadow-lg shadow-brand-600/30
                   hover:bg-brand-700 transition-colors"
      >
        {ouvert ? <X size={24} /> : <Sparkles size={26} />}
      </button>

      {/* --- Fenêtre de chat --- */}
      <AnimatePresence>
        {ouvert && (
          <motion.div
            ref={panneauRef}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-40 flex h-[520px] w-[calc(100vw-2.5rem)] max-w-sm
                       flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl
                       dark:border-white/10 dark:bg-dark-card"
          >
            {/* En-tête */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Assistant SAV</p>
                <p className="text-xs text-emerald-500">● En ligne</p>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Contacter sur WhatsApp"
                aria-label="Contacter sur WhatsApp"
                className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
              >
                <IconeWhatsApp size={18} />
              </a>
              <button
                type="button"
                onClick={reinitialiser}
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100'
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{m.content}</span>
                    {/* Bouton d'action DANS la bulle du chatbot qui propose l'intervention */}
                    {m.role === 'assistant' && m.suggestion && (
                      <button
                        type="button"
                        onClick={() => ouvrirCreation(m.suggestion)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-500 bg-brand-100 px-3 py-2
                                   text-sm font-semibold text-brand-700 hover:bg-brand-200
                                   dark:border-brand-500/60 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25 transition-colors"
                      >
                        <PlusCircle size={16} /> Créer la demande d'intervention
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Indicateur de frappe */}
              {chargement && (
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-white/10">
                    {[0, 1, 2].map((n) => (
                      <span
                        key={n}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${n * 0.15}s` }}
                      />
                    ))}
                  </div>
                  {attenteLongue && (
                    <span className="px-1 text-xs text-slate-400">L'assistant prépare votre réponse…</span>
                  )}
                </div>
              )}

              <div ref={finListe} />
            </div>

            {/* Saisie */}
            <form onSubmit={envoyer} className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-white/10">
              <input
                ref={champSaisie}
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                placeholder="Décrivez votre problème…"
                maxLength={2000}
                className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3.5 py-2 text-sm
                           text-slate-800 outline-none placeholder:text-slate-400
                           focus:border-brand-400 dark:border-white/10 dark:text-white"
              />
              <button
                type="submit"
                disabled={!saisie.trim() || chargement}
                aria-label="Envoyer"
                className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white
                           hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale de création pré-remplie par l'IA */}
      <CreerInterventionModal
        open={modalCreation}
        initial={suggestionActive}
        onClose={() => setModalCreation(false)}
        onCree={() => {
          setSuggestionActive(null);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                'Votre demande d\'intervention a bien été créée ! '
                + 'Vous pouvez suivre son avancement dans la page Interventions.',
            },
          ]);
        }}
      />
    </>
  );
}
