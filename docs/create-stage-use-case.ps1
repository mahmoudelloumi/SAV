Add-Type -AssemblyName System.Drawing

$width = 1600
$height = 980
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$graphics.Clear([System.Drawing.Color]::White)

$ink = [System.Drawing.Color]::FromArgb(30, 41, 59)
$accent = [System.Drawing.Color]::FromArgb(37, 99, 235)
$linePen = New-Object System.Drawing.Pen $ink, 2.4
$accentPen = New-Object System.Drawing.Pen $accent, 2.6
$titleFont = New-Object System.Drawing.Font 'Arial', 24, ([System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font 'Arial', 15
$labelFont = New-Object System.Drawing.Font 'Arial', 16
$actorFont = New-Object System.Drawing.Font 'Arial', 17, ([System.Drawing.FontStyle]::Bold)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center

function Draw-Actor([int]$x, [int]$y, [string]$label) {
    $head = New-Object System.Drawing.Rectangle ($x - 13), $y, 26, 26
    $graphics.DrawEllipse($linePen, $head)
    $graphics.DrawLine($linePen, $x, ($y + 26), $x, ($y + 74))
    $graphics.DrawLine($linePen, ($x - 30), ($y + 43), ($x + 30), ($y + 43))
    $graphics.DrawLine($linePen, $x, ($y + 74), ($x - 26), ($y + 108))
    $graphics.DrawLine($linePen, $x, ($y + 74), ($x + 26), ($y + 108))
    $graphics.DrawString($label, $actorFont, (New-Object System.Drawing.SolidBrush $ink), (New-Object System.Drawing.RectangleF ($x - 90), ($y + 120), 180, 30), $format)
}

function Draw-UseCase([int]$x, [int]$y, [int]$w, [int]$h, [string]$label) {
    $rectangle = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $graphics.DrawEllipse($accentPen, $rectangle)
    $graphics.DrawString($label, $labelFont, (New-Object System.Drawing.SolidBrush $ink), (New-Object System.Drawing.RectangleF $x, $y, $w, $h), $format)
}

$graphics.DrawString('Diagramme de cas d''utilisation', $titleFont, (New-Object System.Drawing.SolidBrush $ink), (New-Object System.Drawing.RectangleF 0, 24, $width, 42), $format)
$graphics.DrawString('Systeme de gestion des stages', $subtitleFont, (New-Object System.Drawing.SolidBrush $ink), (New-Object System.Drawing.RectangleF 0, 68, $width, 30), $format)

$system = New-Object System.Drawing.Rectangle 320, 135, 960, 750
$graphics.DrawRectangle($linePen, $system)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), 350, 121, 280, 28)
$graphics.DrawString('Systeme de gestion des stages', $subtitleFont, (New-Object System.Drawing.SolidBrush $ink), (New-Object System.Drawing.RectangleF 360, 116, 270, 32), $format)

Draw-Actor 150 280 'Stagiaire'
Draw-Actor 1450 290 'Encadrant'
Draw-Actor 1450 650 'Administrateur'

Draw-UseCase 450 210 270 62 'Se connecter'
Draw-UseCase 450 320 270 62 'Consulter les offres'
Draw-UseCase 450 430 270 62 'Deposer une demande'
Draw-UseCase 450 540 270 62 'Suivre la demande'
Draw-UseCase 450 650 270 62 'Deposer le rapport'
Draw-UseCase 870 250 270 62 'Valider le rapport'
Draw-UseCase 870 390 270 62 'Evaluer le stagiaire'
Draw-UseCase 870 570 270 62 'Gerer les stagiaires'
Draw-UseCase 870 700 270 62 'Gerer les offres'

# Associations acteurs - cas d'utilisation
$graphics.DrawLine($linePen, 180, 323, 450, 241)
$graphics.DrawLine($linePen, 180, 340, 450, 351)
$graphics.DrawLine($linePen, 180, 350, 450, 461)
$graphics.DrawLine($linePen, 180, 362, 450, 571)
$graphics.DrawLine($linePen, 180, 376, 450, 681)
$graphics.DrawLine($linePen, 1420, 333, 1140, 281)
$graphics.DrawLine($linePen, 1420, 348, 1140, 421)
$graphics.DrawLine($linePen, 1420, 695, 1140, 601)
$graphics.DrawLine($linePen, 1420, 715, 1140, 731)

$bitmap.Save('C:\SAV\docs\diagramme-cas-utilisation-stages.png', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
