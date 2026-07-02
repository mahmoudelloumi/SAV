package com.sav.model;

import lombok.*;

/**
 * Secret et URI du QR Code pour la configuration du 2FA.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TotpResponse {
    private String secret;
    private String qrCodeImageUri;
}
