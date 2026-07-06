import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquareOff } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useInterventions } from '../../hooks/useInterventions.js';
import { getCommentaires, ajouterCommentaire } from '../../api/commentaireService.js';
import { LIBELLES_ROLE } from '../../constants/sav.js';

// ============================================================
// Messagerie réelle : une conversation = une intervention. Les messages
// (commentaires) sont échangés entre le client, l'employé affecté et le
// directeur. Rafraîchissement automatique par polling toutes les 4 s.
// ============================================================

const POLL_INTERVAL_MS = 4000;

export default function Messagerie() {
  const { user } = useAuth();
  const { content: interventions, chargement: chargementInterventions } = useInterventions(user, { size: 50 });

  const [selectionId, setSelectionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const scrollRef = useRef(null);

  // Sélectionne automatiquement la 1ère intervention dès que la liste arrive.
  useEffect(() => {
    if (!selectionId && interventions.length > 0) {
      setSelectionId(interventions[0].id);
    }
  }, [interventions, selectionId]);

  const chargerMessages = useCallback(async () => {
    if (!selectionId) return;
    try {
      const { data } = await getCommentaires(selectionId);
      setMessages(data.content);
    } catch (err) {
      // Erreur silencieuse pendant le polling pour ne pas casser l'UI.
      console.error('Erreur chargement messages', err);
    }
  }, [selectionId]);

  // Chargement initial + polling tant que la conversation est ouverte.
  useEffect(() => {
    if (!selectionId) return;
    setMessages([]);
    chargerMessages();
    const interval = setInterval(chargerMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectionId, chargerMessages]);

  // Défilement automatique vers le bas à chaque nouveau message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function envoyer(e) {
    e.preventDefault();
    if (!texte.trim() || !selectionId) return;
    const contenu = texte;
    setTexte('');
    try {
      await ajouterCommentaire(selectionId, contenu);
      await chargerMessages();
    } catch (err) {
      console.error('Erreur envoi message', err);
      setTexte(contenu); // on restaure le texte en cas d'échec
    }
  }

  const conversation = interventions.find((i) => i.id === selectionId);

  // Nom affiché d'une conversation : raison sociale du client (repli sur le nom).
  const nomClient = (i) => i?.clientRaisonSociale || i?.clientNom || 'Client';

  // État vide : aucune intervention → aucune conversation possible.
  if (!chargementInterventions && interventions.length === 0) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center gap-3">
        <MessageSquareOff className="text-slate-300 dark:text-slate-600" size={48} />
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Aucune intervention pour le moment. Les échanges apparaîtront ici dès qu'une
          intervention sera créée.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">Messagerie</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Échangez au sujet de chaque intervention avec le client, l'employé affecté et le directeur.
      </p>

      <Card className="flex h-[calc(100%-4.5rem)] overflow-hidden">
        {/* Liste des conversations (interventions) */}
        <div className="w-72 border-r border-slate-100 dark:border-white/10 overflow-y-auto shrink-0">
          {interventions.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelectionId(i.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                i.id === selectionId ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <Avatar nom={nomClient(i)} prenom="" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{nomClient(i)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{i.code}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Fil de discussion */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-white/10">
            <Avatar nom={nomClient(conversation)} prenom="" size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{nomClient(conversation)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conversation?.code}</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-slate-400 mt-8">
                Aucun message pour le moment. Écrivez le premier !
              </p>
            ) : (
              messages.map((m) => {
                const estMoi = m.auteurId === user.userId;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${estMoi ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                        estMoi
                          ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      {!estMoi && (
                        <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                          {m.auteurNom} · {LIBELLES_ROLE[m.auteurRole] || m.auteurRole}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.contenu}</p>
                      <p className={`mt-1 text-[10px] ${estMoi ? 'text-white/70' : 'text-slate-400'}`}>
                        {formatHeure(m.dateCreation)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <form onSubmit={envoyer} className="flex items-center gap-2 border-t border-slate-100 dark:border-white/10 p-4">
            <input
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Écrire un message…"
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button type="submit" className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 p-2.5 text-white shadow-glow">
              <Send size={17} />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}

function formatHeure(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
