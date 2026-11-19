---
version: 1
slug: "src-app-w-slug-invite-page-tsx"
primary_target: "src/app/w/[slug]/invite/page.tsx"
related_targets: ["src/components/invitation","src/app/thiep-cuoi"]
---

# Online wedding invitation (thiệp cưới online)

Scope: the public invitation page per wedding (`/w/[slug]/invite`, short link `/thiep/[slug]`), the template gallery (`/thiep-cuoi`, demo per template), and the owner editor tab in the dashboard.
Visitor mode: Experience (guest inside the card); gallery is Persuade; editor is Operate.

Audience and job: guests (often older relatives on phones in Zalo) open a link or QR, learn who/when/where, say if they come, leave a wish, send a gift into the couple's own account (SePay confirms), step into the 3D hall. The couple picks one of 12 templates and fills content.

Constraints: free for every tier; gift box only on paid tiers with a bank account (no amounts ever public); music = in-browser music box by default or the couple's own https audio link; mobile-first, big tap targets, correct Vietnamese diacritics; lunar date beside solar.

## Direction contract

THESIS: The invitation is a printed Vietnamese wedding card you open: a sealed envelope addressed to the guest by name, then the card itself is the page. Each template is a complete paper-and-ink world. Refuses the generic wedding-website stack (hero photo, white cards, icon rows).

OWN-WORLD: Twelve card worlds with their own ground, paper, ink and ornament: red + gold 囍 seal; lacquer black-red with gold cloud scrolls; lotus pink on lotus-leaf green; ivory with hairline rules; watercolour roses; eucalyptus on kraft; dusty-rose lace scallops and double frames; black and gold baroque flourishes; pastel pink ribbons; black-and-white magazine cover with one red rule; navy with sea-wave bands; wine red with handwritten script. Ornaments are drawn SVG, paper carries a grain.

STORY: A guest opens the envelope, reads the names, solar and lunar date and a countdown, sees both families, finds each ceremony with time, place and a map, scrolls their story and photos, confirms attendance, leaves a wish, sends a gift by QR, and enters the 3D hall.

FIRST VIEWPORT: Full-screen sealed envelope in the template's colours, a seal at the flap, "Kính mời" over the guest's name (or "Quý khách"), a tap prompt. Tapping breaks the seal, the flap lifts, the card rises: couple names at full width, date in solar and lunar.

FORM: printed wedding card and envelope; seed: none (pinned) — "Tìm các trang tạo thiệp cưới online đẹp hot mà học làm theo, thiết kế ra nhiều mẫu thiệp đẹp như vậy". The user pinned the reference set ("học làm theo" the popular Vietnamese online-invitation sites); the tap-to-open envelope addressed to the guest is the shared convention of that set, so it is taken from the pinned reference rather than rolled.

Structure per world (finish review 1): each template carries its own corner language (soft / gentle / square), a printed card frame (none, hairline, double, gold inset), a countdown form (tiles or ruled numerals), a readable accent for text (≥ 4.5:1) and its own script face; on phones the card sits inset on its ground.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: the envelope opening (seal, flap, card rising) with music starting on that tap.

Unresolved: real couple photos come from the album; demo templates use labelled sample content.
