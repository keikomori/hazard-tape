<p align="right"><strong>English</strong> · <a href="README.pt-BR.md">Português</a></p>

# Hazard Tape

[![version](https://img.shields.io/badge/version-1.0.0-111111?style=flat-square)](manifest.json)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-F5C518?style=flat-square&labelColor=111111)
![Chrome](https://img.shields.io/badge/Chrome-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Brave](https://img.shields.io/badge/Brave-FB542B?style=flat-square&logo=brave&logoColor=white)
![Edge](https://img.shields.io/badge/Edge-0078D7?style=flat-square&logo=microsoftedge&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=flat-square&logo=firefox&logoColor=white)

A colored banner for Brave, Chrome, Edge, and Firefox. Test, staging, local, and production stay visually distinct, so the wrong environment is obvious before anyone edits it.

Manifest V3. The banner is drawn in a closed Shadow DOM with `pointer-events: none`: the page layout stays intact, and clicks pass through.

## Compared with Environment Indicator

| | Environment Indicator | Hazard Tape |
| --- | --- | --- |
| URL path | Host only | Host and path |
| Isolation | CSS injected into the page | Closed Shadow DOM |
| Single-page apps | | Re-checks on client-side navigation |
| Tab title | | Prefix, such as `[HML] ` |
| Toolbar badge | | Yes |
| Frame and hazard stripes | | Yes |
| Hide on one tab | | From the popup |
| Import and export | JSON | JSON |

## Permissions

| Permission | What it does |
| --- | --- |
| `storage` | Keeps the rules in the browser. Nothing leaves the machine. |
| `activeTab` | Lets the popup read the current tab address when the icon is clicked. |
| Content script | Runs on `http` and `https` to test the rules. Sends no data. |

## Installation

Keep this folder on disk. The browser loads the extension from it. The rules page opens with three examples: Local, Staging, and Production. Production starts disabled.

**Brave, Chrome, or Edge**

1. Open `brave://extensions`, `chrome://extensions`, or `edge://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `hazard-tape` folder.

After a code change, reload the extension from its card on that page.

**Firefox 142 or newer**

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `manifest.json` inside `hazard-tape`.

This load lasts until Firefox closes. After a code change, reload the add-on on that page. A lasting install is a signed package on addons.mozilla.org.

## Rules

| Setting | Behavior |
| --- | --- |
| Compare against | The domain only (`staging.empresa.com.br`, port included) or the full URL: domain, path, `?query`, and `#hash`. |
| Match type | Contains, starts with, ends with, equals, wildcard (`*-stg.*.com.br`), or regular expression. |
| Patterns | One per line. A single match is enough. |
| Priority | The first enabled rule that matches is the one applied. Reorder with ↑ ↓. |

**Test an address** shows at once whether the rule matches, and whether another rule comes first.

**Appearance.** Diagonal tape, a bar at the top or the bottom, a corner triangle, or a frame only. Background and text color, opacity, hazard stripes, a frame around the screen, and a tab-title prefix.

## Sharing with the team

| Method | How |
| --- | --- |
| Rules file | Configure once, click **Export**, and send `tarja-ambiente-regras.json`. Each person uses **Import**. |
| Unpacked folder | Follow the installation steps above. |
| Chrome Web Store, unlisted | Only people with the link can install it. Updates are automatic. Developer registration has a one-time fee. |
| Browser policy | Brave and Chrome accept `ExtensionInstallForcelist` through GPO or MDM, on every machine. |
| addons.mozilla.org | Signed package for a lasting Firefox install. It can be unlisted. |

## Development

Rule matching also runs in Node.

```bash
node --test tests/rules.test.js
```

| File | Role |
| --- | --- |
| `manifest.json` | Manifest V3 |
| `background.js` | Installs the examples and updates the toolbar badge |
| `content.js` | Decides whether the page matches and draws the banner |
| `lib/rules.js` | Rule model and matching logic |
| `lib/render.js` | Banner drawing in a Shadow DOM |
| `popup.html`, `popup.js` | Toolbar popup |
| `options.html`, `options.js` | Rules page |
| `ui.css` | Popup and options styles, light and dark |
| `tests/` | Matching-logic tests |

---

**Keiko Solutions** · Maintainer: Keiko Mori
