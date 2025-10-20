![Logo](admin/vis-2-widgets-deluxe.png)

# Custom Deluxe Widgets for ioBroker.vis 2.0

![Number of Installations](http://iobroker.live/badges/vis-2-widgets-deluxe-installed.svg)
![Number of Installations](http://iobroker.live/badges/vis-2-widgets-deluxe-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.vis-2-widgets-deluxe.svg)](https://www.npmjs.com/package/iobroker.vis-2-widgets-deluxe)
[![Downloads](https://img.shields.io/npm/dm/iobroker.vis-2-widgets-deluxe.svg)](https://www.npmjs.com/package/iobroker.vis-2-widgets-deluxe)

[![NPM](https://nodei.co/npm/iobroker.vis-2-widgets-deluxe.png?downloads=true)](https://nodei.co/npm/iobroker.vis-2-widgets-deluxe/)

## Beschreibung

Custom Widgets für ioBroker vis-2 zur Steuerung verschiedener Smart-Home-Geräte mit einem einheitlichen, flexiblen Widget.

## Installation

Installieren Sie den Adapter über die ioBroker Admin-Oberfläche oder via npm:

```bash
npm install iobroker.vis-2-widgets-deluxe
```

## Widgets

### One Icon To Rule Them All

Ein universelles Widget mit verschiedenen Modi zur Steuerung unterschiedlicher Gerätetypen:

#### Modi

**Dimmer (Dialog)**

- Dimmer-Steuerung mit Dialog-Fenster
- Slider von 0-100%
- Schnellwahl-Buttons für häufige Helligkeitsstufen
- Individuell anpassbares Icon mit Status-Anzeige

**Switch (Toggle)**

- Einfacher Ein/Aus-Schalter
- Direktes Umschalten per Klick
- Visuelle Status-Rückmeldung
- Anpassbare Icons für Ein/Aus-Zustand

**Heating (KNX)**

- Heizungssteuerung für KNX-Systeme
- Sollwert-Einstellung
- Betriebsmodus-Auswahl (Komfort, Standby, Nacht, Frost)
- Anzeige von Ist- und Solltemperatur
- Dialog mit vollständiger Steuerung

#### Allgemeine Features

- **Anpassbares Design**: Farben, Icons, Größen
- **Echtzeit-Updates**: Sofortige Darstellung von Zustandsänderungen
- **Material-UI**: Modernes, responsives Design
- **Mehrsprachig**: Unterstützung für Deutsch, Englisch, Russisch

### Hello World Widget

Demo-Widget zum Testen und als Beispiel für die Widget-Entwicklung.

## Changelog

<!--
  Placeholder for the next version (at the beginning of the line):
  ### **WORK IN PROGRESS**
-->
### 0.2.2 (2025-10-20)

- translations
- refactor & cleanup
- docs

### 0.2.1 (2025-10-19)

- fix deps

### 0.2.0 (2025-10-19)

- new general purpose widget >> "one icon to rule them all"
- dimmer widget removed
- refactor & cleanup

### 0.1.3 (2025-10-19)

- npm deployment adjusted

### 0.1.2 (2025-10-15)

- dimmer functional (not finished)
- card and colors fixed, better defaults
- Sizing fixen

### 0.1.1 (2025-10-12)

- Testrelease

### 0.1.0 (2024-01-XX)

- Initial release with HelloWorld widget
- Basic framework setup
- Development environment configured

## License

MIT License

Copyright (c) 2025 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
