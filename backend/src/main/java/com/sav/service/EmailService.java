package com.sav.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service d'envoi d'e-mails (asynchrone). Requiert la config spring.mail.*.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${application.mail.from:no-reply@idsoft.tn}")
    private String expediteur;

    /**
     * Envoie le rapport de clôture (PDF) par e-mail au client (et en copie à
     * l'employé affecté si fourni). Exécuté en arrière-plan : un échec d'envoi
     * ne bloque jamais la clôture de l'intervention.
     */
    @Async
    public void envoyerRapportCloture(String destinataire, String copie, String codeIntervention, byte[] pdf) {
        if (destinataire == null || destinataire.isBlank()) {
            log.warn("Rapport {} : aucun destinataire, e-mail non envoyé.", codeIntervention);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(expediteur);
            helper.setTo(destinataire);
            if (copie != null && !copie.isBlank() && !copie.equalsIgnoreCase(destinataire)) {
                helper.setCc(copie);
            }
            helper.setSubject("Rapport de clôture - " + codeIntervention);
            helper.setText(
                    "Bonjour,\n\n" +
                    "Votre intervention " + codeIntervention + " a été clôturée.\n" +
                    "Vous trouverez ci-joint le rapport de clôture au format PDF.\n\n" +
                    "Cordialement,\n" +
                    "ID Software Solutions — Service SAV");
            helper.addAttachment("rapport-" + codeIntervention + ".pdf", new ByteArrayResource(pdf));

            mailSender.send(message);
            log.info("Rapport de clôture {} envoyé à {}", codeIntervention, destinataire);
        } catch (MessagingException | RuntimeException e) {
            log.error("Échec de l'envoi du rapport {} : {}", codeIntervention, e.getMessage());
        }
    }

    /**
     * Envoie au client le code d'acceptation d'une intervention créée pour lui par
     * un employé/directeur. Le client saisit ce code pour confirmer l'intervention.
     */
    @Async
    public void envoyerCodeConfirmation(String destinataire, String codeIntervention, String codeConfirmation) {
        if (destinataire == null || destinataire.isBlank()) {
            log.warn("Intervention {} : aucun destinataire, code de confirmation non envoyé.", codeIntervention);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // multipart = false : e-mail HTML en une seule partie, sans aucune pièce jointe/inline.
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(expediteur);
            helper.setTo(destinataire);
            helper.setSubject("Confirmation de votre intervention " + codeIntervention);
            helper.setText(gabaritConfirmation(codeIntervention, codeConfirmation), true);

            mailSender.send(message);
            log.info("Code de confirmation de {} envoyé à {}", codeIntervention, destinataire);
        } catch (MessagingException | RuntimeException e) {
            log.error("Échec de l'envoi du code de confirmation {} : {}", codeIntervention, e.getMessage());
        }
    }

    /**
     * Envoie un code de connexion (2FA) par e-mail — méthode alternative à
     * Google Authenticator.
     */
    @Async
    public void envoyerCodeAuthentification(String destinataire, String code, int validiteMinutes) {
        if (destinataire == null || destinataire.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(expediteur);
            helper.setTo(destinataire);
            helper.setSubject("Votre code de connexion ID SOFT");
            helper.setText(gabaritCode(
                    "Code de connexion",
                    "Voici votre code de connexion à usage unique. Il expire dans " + validiteMinutes + " minutes.",
                    code), true);

            mailSender.send(message);
            log.info("Code 2FA e-mail envoyé à {}", destinataire);
        } catch (MessagingException | RuntimeException e) {
            log.error("Échec de l'envoi du code 2FA à {} : {}", destinataire, e.getMessage());
        }
    }

    // Gabarit HTML de l'e-mail de confirmation (logo + code mis en avant).
    private String gabaritConfirmation(String codeIntervention, String codeConfirmation) {
        return """
            <div style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
                <tr><td align="center">
                  <table role="presentation" width="520" cellpadding="0" cellspacing="0"
                         style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.08);">
                    <tr>
                      <td style="background:#fff7ed;padding:24px 32px;text-align:center;border-bottom:3px solid #fed7aa;">
                        <span style="font-size:22px;font-weight:800;color:#ea580c;letter-spacing:.5px;">ID Software Solutions</span>
                        <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Service SAV</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px;">
                        <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Confirmez votre intervention</h1>
                        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
                          Bonjour,<br/>
                          Une intervention <strong>%s</strong> a été enregistrée pour vous par notre service SAV.
                          Voici votre code de confirmation :
                        </p>
                        <div style="text-align:center;margin:24px 0;">
                          <div style="display:inline-block;background:#fff7ed;border:1px dashed #fdba74;border-radius:12px;
                                      padding:16px 28px;font-size:32px;font-weight:700;letter-spacing:8px;color:#ea580c;">
                            %s
                          </div>
                        </div>
                        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#475569;">
                          <strong>Communiquez ce code à votre conseiller SAV</strong> pour valider et lancer l'intervention.
                        </p>
                        <p style="margin:0;font-size:13px;color:#94a3b8;">
                          Tant qu'il n'est pas validé, l'intervention reste en attente.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;">
                          ID Software Solutions — Service SAV<br/>
                          Ce message est automatique, merci de ne pas y répondre.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </div>
            """.formatted(codeIntervention, codeConfirmation);
    }

    // Gabarit HTML générique : titre + message + un code mis en avant.
    private String gabaritCode(String titre, String message, String code) {
        return """
            <div style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
                <tr><td align="center">
                  <table role="presentation" width="520" cellpadding="0" cellspacing="0"
                         style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.08);">
                    <tr>
                      <td style="background:#fff7ed;padding:24px 32px;text-align:center;border-bottom:3px solid #fed7aa;">
                        <span style="font-size:22px;font-weight:800;color:#ea580c;letter-spacing:.5px;">ID Software Solutions</span>
                        <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Service SAV</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px;">
                        <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">%s</h1>
                        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">%s</p>
                        <div style="text-align:center;margin:24px 0;">
                          <div style="display:inline-block;background:#fff7ed;border:1px dashed #fdba74;border-radius:12px;
                                      padding:16px 28px;font-size:32px;font-weight:700;letter-spacing:8px;color:#ea580c;">
                            %s
                          </div>
                        </div>
                        <p style="margin:0;font-size:13px;color:#94a3b8;">
                          Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;">
                          ID Software Solutions — Service SAV<br/>
                          Ce message est automatique, merci de ne pas y répondre.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </div>
            """.formatted(titre, message, code);
    }
}
