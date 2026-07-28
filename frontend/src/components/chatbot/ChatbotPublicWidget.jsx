import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, Sparkles, RotateCcw, LogIn, UserPlus } from 'lucide-react';
import { envoyerMessageChatbotPublic } from '../../api/chatbotService.js';

// Logo WhatsApp (SVG) — lucide n'a pas d'icône de marque.
function IconeWhatsApp({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ============================================================
// Assistant public (pages publiques) : répond aux visiteurs sur la
// création de compte, la connexion, les contacts, l'adresse et la
// disponibilité. Aucune authentification requise.
// ============================================================

const WHATSAPP_NUMERO = '21652316703';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("Bonjour, j'ai une question concernant vos services.")}`;

const MESSAGE_ACCUEIL = {
  role: 'assistant',
  content:
    "Bonjour ! Je peux vous aider à créer un compte, vous connecter, ou vous donner "
    + 'nos coordonnées, notre adresse et nos disponibilités. Que souhaitez-vous savoir ?',
};

const SUGGESTIONS = [
  'Comment créer un compte ?',
  'Comment me connecter ?',
  'Quels sont vos horaires ?',
  'Où êtes-vous situés ?',
];

export default function ChatbotPublicWidget() {
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

  // Après 2,5 s d'attente, on affiche un petit message rassurant.
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
      const { data } = await envoyerMessageChatbotPublic(texte, historique);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reponse }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Désolé, je n'arrive pas à répondre pour le moment. "
            + 'Contactez-nous sur WhatsApp au +216 52 316 703.',
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
      {/* Bulle flottante (au-dessus de la bulle WhatsApp) */}
      <button
        ref={bulleRef}
        onClick={() => setOuvert((o) => !o)}
        aria-label="Assistant"
        title="Assistant"
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full
                   bg-brand-600 text-white shadow-lg shadow-brand-600/30
                   hover:bg-brand-700 transition-colors"
      >
        {ouvert ? <X size={24} /> : <Sparkles size={26} />}
      </button>

      <AnimatePresence>
        {ouvert && (
          <motion.div
            ref={panneauRef}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[calc(100vw-3rem)] max-w-sm
                       flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl
                       dark:border-white/10 dark:bg-dark-card"
          >
            {/* En-tête */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Assistant ID SOFT</p>
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
                    <span className="px-1 text-xs text-slate-400">L'assistant prépare votre réponse…</span>
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

            {/* Accès rapides connexion / inscription */}
            <div className="flex gap-2 border-t border-slate-100 px-3 pt-2 dark:border-white/10">
              <Link
                to="/login"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand-500
                           bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-200
                           dark:border-brand-500/60 dark:bg-brand-500/15 dark:text-brand-300 transition-colors"
              >
                <LogIn size={14} /> Connexion
              </Link>
              <Link
                to="/register"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200
                           px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-600
                           dark:border-white/10 dark:text-slate-300 transition-colors"
              >
                <UserPlus size={14} /> Créer un compte
              </Link>
            </div>

            {/* Saisie */}
            <form onSubmit={envoyer} className="flex items-center gap-2 p-3">
              <input
                ref={champSaisie}
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                placeholder="Posez votre question…"
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

export { WHATSAPP_NUMERO };
