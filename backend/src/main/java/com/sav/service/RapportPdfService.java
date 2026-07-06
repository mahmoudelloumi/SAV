package com.sav.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.sav.model.Intervention;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Génère le rapport de clôture d'une intervention au format PDF (iText 5).
 */
@Service
@Slf4j
public class RapportPdfService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final BaseColor ORANGE = new BaseColor(255, 122, 0);
    private static final BaseColor GRIS = new BaseColor(100, 116, 139);

    public byte[] genererRapportCloture(Intervention i) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 48, 48, 54, 54);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titre = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD, ORANGE);
            Font sousTitre = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, GRIS);
            Font h2 = new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD, BaseColor.DARK_GRAY);
            Font corps = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, BaseColor.BLACK);

            // En-tête
            Paragraph entete = new Paragraph("ID Software Solutions", titre);
            doc.add(entete);
            doc.add(new Paragraph("Rapport de clôture d'intervention", sousTitre));
            doc.add(Chunk.NEWLINE);

            Paragraph codeP = new Paragraph(i.getCode(), h2);
            doc.add(codeP);
            doc.add(Chunk.NEWLINE);

            // Tableau des informations
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.1f, 2.9f});

            ligne(table, "Client", valeurClient(i));
            ligne(table, "Employé affecté", i.getEmployeAffecte() != null
                    ? i.getEmployeAffecte().getNom() + " " + i.getEmployeAffecte().getPrenom() : "—");
            ligne(table, "Priorité", i.getPriorite() != null ? i.getPriorite().name() : "—");
            ligne(table, "État", i.getEtat() != null ? i.getEtat().name() : "—");
            ligne(table, "Créée le", i.getDateCreation() != null ? i.getDateCreation().format(FMT) : "—");
            ligne(table, "Clôturée le", i.getDateCloture() != null ? i.getDateCloture().format(FMT) : "—");
            ligne(table, "Prix final", i.getPrixFinal() != null ? montant(i.getPrixFinal()) : "—");
            doc.add(table);
            doc.add(Chunk.NEWLINE);

            // Description du problème
            doc.add(new Paragraph("Description du problème", h2));
            doc.add(new Paragraph(vide(i.getDescription()), corps));
            doc.add(Chunk.NEWLINE);

            // Rapport technique
            doc.add(new Paragraph("Rapport technique", h2));
            doc.add(new Paragraph(vide(i.getRapportTechnique()), corps));

            // Pied de page
            doc.add(Chunk.NEWLINE);
            doc.add(Chunk.NEWLINE);
            Paragraph pied = new Paragraph(
                    "Document généré automatiquement par ID Software Solutions — Gestion SAV.", sousTitre);
            pied.setAlignment(Element.ALIGN_CENTER);
            doc.add(pied);

            doc.close();
            return out.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            log.error("Erreur lors de la génération du PDF de clôture pour {} : {}",
                    i.getCode(), e.getMessage());
            throw new RuntimeException("Impossible de générer le rapport PDF", e);
        }
    }

    private void ligne(PdfPTable table, String cle, String valeur) {
        Font fCle = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, GRIS);
        Font fVal = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, BaseColor.BLACK);

        PdfPCell c1 = new PdfPCell(new Phrase(cle, fCle));
        PdfPCell c2 = new PdfPCell(new Phrase(valeur, fVal));
        for (PdfPCell c : new PdfPCell[]{c1, c2}) {
            c.setPadding(6);
            c.setBorderColor(new BaseColor(226, 232, 240));
        }
        table.addCell(c1);
        table.addCell(c2);
    }

    private String valeurClient(Intervention i) {
        if (i.getClient() == null) return "—";
        String rs = i.getClient().getRaisonSociale();
        String nom = i.getClient().getNom() + " " + i.getClient().getPrenom();
        return rs != null && !rs.isBlank() ? rs + " (" + nom + ")" : nom;
    }

    private String montant(BigDecimal v) {
        return v.toPlainString() + " DT";
    }

    private String vide(String s) {
        return (s == null || s.isBlank()) ? "—" : s;
    }
}
