import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, BarChart3, RotateCcw } from 'lucide-react';
import { envoyerMessageChatbotAdmin } from '../../api/chatbotService.js';

// ============================================================
// Assistant de données réservé au DIRECTEUR : répond aux questions sur
// les statistiques (CA total et par employé, interventions par employé…)
// et les coordonnées des clients et employés. Les réponses proviennent
// exclusivement des données réelles de l'entreprise.
// ============================================================

const MESSAGE_ACCUEIL = {
  role: 'assistant',
  content:
    "Bonjour ! Je suis votre assistant de données. Posez-moi une question sur le chiffre "
    + "d'affaires, les performances des employés, les interventions ou les coordonnées "
    + 'des clients et employés.',
};

const SUGGESTIONS = [
  'Quel employé génère le plus de CA ?',
  'CA total et du mois ?',
  'Combien d\'interventions par employé ?',
  'Coordonnées de l\'employé le plus chargé ?',
];

export default function AssistantAdminWidget() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([MESSAGE_ACCUEIL]);
  const [saisie, setSaisie] = useState('');
  const [chargement, setChargement] = useState(false);
  const [attenteLongue, setAttenteLongue] = useState(false);

  const finListe = useRef(null);
  const champSaisie = useRef(null);
  const panneauRef = useRef(null);
  const bulleRef = useRef(null);

  useEffect(() => {
    finListe.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chargement, attenteLongue]);

  // Clic en dehors : ferme le panneau sans réinitialiser la conversation.
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

  useEffect(() => {
    if (!chargement) { setAttenteLongue(false); return; }
    const t = setTimeout(() => setAttenteLongue(true), 2500);
    return () => clearTimeout(t);
  }, [chargement]);

  useEffect(() => {
    if (ouvert) champSaisie.current?.focus();
  }, [ouvert]);

  async function envoyer(e, texteImpose) {
    e?.preventDefault();
    const texte = (texteImpose ?? saisie).trim();
    if (!texte || chargement) return;

    const historique = messages
      .filter((m) => m !== MESSAGE_ACCUEIL)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: 'user', content: texte }]);
    setSaisie('');
    setChargement(true);

    try {
      const { data } = await envoyerMessageChatbotAdmin(texte, historique);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reponse }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Désolé, je n'arrive pas à répondre pour le moment. Vérifiez qu'Ollama est démarré.",
        },
      ]);
    } finally {
      setChargement(false);
    }
  }

  function reinitialiser() {
    setMessages([MESSAGE_ACCUEIL]);
    setSaisie('');
    champSaisie.current?.focus();
  }

  return (
    <>
      {/* Bulle flottante */}
      <button
        ref={bulleRef}
        onClick={() => setOuvert((o) => !o)}
        aria-label="Assistant de données"
        title="Assistant de données"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full
                   bg-brand-600 text-white shadow-lg shadow-brand-600/30
                   hover:bg-brand-700 transition-colors"
      >
        {ouvert ? <X size={24} /> : <BarChart3 size={24} />}
      </button>

      <AnimatePresence>
        {ouvert && (
          <motion.div
            ref={panneauRef}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-40 flex h-[540px] w-[calc(100vw-2.5rem)] max-w-sm
                       flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl
                       dark:border-white/10 dark:bg-dark-card"
          >
            {/* En-tête */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                <BarChart3 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Assistant de données</p>
                <p className="text-xs text-emerald-500">● En ligne</p>
              </div>
              <button
                type="button"
                onClick={reinitialiser}
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
                className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {chargement && (
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-white/10">
                    {[0, 1, 2].map((n) => (
                      <span key={n} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </div>
                  {attenteLongue && (
                    <span className="px-1 text-xs text-slate-400">L'assistant analyse les données…</span>
                  )}
                </div>
              )}

              {/* Questions rapides (au tout début) */}
              {messages.length === 1 && !chargement && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => envoyer(e, s)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600
                                 hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:text-slate-300
                                 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
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
                placeholder="Posez une question sur vos données…"
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
    </>
  );
}
