# Soresu-form system (form rendering & editing)

## Form Data Model

Forms are stored as JSON in the database, one per avustushaku. The JSON has a `content` array of top-level elements, each of which can have nested `children`. Every element has:
- `fieldClass`: `"formField"` (user-editable inputs), `"infoElement"` (read-only text/labels), or `"wrapperElement"` (structural containers)
- `fieldType`: Specific type — `"textField"`, `"textArea"`, `"radioButton"`, `"p"`, `"h1"`, `"fieldset"`, `"theme"`, `"growingFieldset"`, etc.
- `id`: Unique identifier within the form
- `params`: Optional parameters like `size`, `maxlength`
- `label`/`text`: Localized content with `fi` and `sv` keys

## Form Structure Hierarchy

```
theme (wrapperElement, renders as <section>)
├── formField (renders as <div> with input inside)
├── infoElement (renders as <p>, <h1>, etc.)
└── fieldset (wrapperElement, renders as <fieldset>)
    ├── formField children
    └── infoElement children
```

- **theme**: Top-level section with a heading. Children render vertically.
- **fieldset**: Groups form fields. Uses `display: flex; flex-wrap: wrap` — children render in a **3-column grid** by default.
- **growingFieldset**: Repeatable group with add/remove buttons. Also flex layout.

## Fieldset Layout (CSS)

Key file: `soresu-form/web/form/style/main.css`

Inside `fieldset.soresu-fieldset`:
- **`<div>` children** (form fields): Constrained to `width: calc(var(--section-width) / 3)` — always 1/3 width, creating a 3-column grid.
- **`<p>` children** (info elements): Take full `var(--section-width)` width, so they always get their own row.
- **Radio/checkbox children**: Take full `var(--section-width)` width.
- **Dropdown children**: Take `calc(var(--section-width) / 2)` — half width.
- **`div.extra-large` children**: Take full `var(--section-width)` width (own row).

To make a form field take its own full-width row in a fieldset, set `"params": {"size": "extra-large"}` in the form JSON. This works for text areas (BasicTextArea applies the size as a CSS class on the wrapper div).

## Size Parameter

The `size` param controls element dimensions. Available string values:
- `extra-extra-small`, `extra-small`, `small`, `medium`, `large`, `extra-large`

For **text fields**: Size controls input width (CSS on the `<input>` element). Note: the size class is currently NOT applied to the `<input>` element's className (removed during .jsx-to-.tsx migration), so these CSS rules have no effect. The wrapper div width is still 1/3 in a fieldset regardless of size.

For **text areas**: Size controls textarea height via CSS (e.g., `medium` = 12em, `extra-large` = 24em). Note: like text fields, the size class is NOT applied to the `<textarea>` element's className. However, the default textarea height is already 12em, so `medium` appears to work by coincidence. The size IS applied to the wrapper div className (for layout purposes).

## Form Component Rendering Chain

```
Form JSON field definition
    → PropertyMapper extracts props (size, maxLength, translations, etc.)
    → Component renders (BasicTextArea, BasicTextField, ParagraphInfoElement, etc.)
    → Wrapper element (Fieldset, GrowingFieldset) applies flex layout
    → CSS rules determine final width/height
```

Key files:
- `soresu-form/web/form/Form.jsx` — Main form renderer, dispatches to components by fieldClass
- `soresu-form/web/form/component/PropertyMapper.js` — Extracts props from field definitions
  - `TextFieldPropertyMapper`: Extracts `size`, `maxLength` for form fields
  - `InfoElementPropertyMapper`: Extracts `translations`, `lang` for info elements (does NOT extract `size`)
- `soresu-form/web/form/component/BasicTextArea.tsx` — Renders `<div class="soresu-text-area [size]"><label/><textarea/></div>`
- `soresu-form/web/form/component/BasicTextField.tsx` — Renders `<div class="soresu-text-field"><label/><input/></div>`
- `soresu-form/web/form/component/InfoElement.jsx` — `ParagraphInfoElement` renders `<p class="soresu-info-element">`
- `soresu-form/web/form/component/wrapper/Fieldset.jsx` — Renders `<fieldset class="soresu-fieldset">`
- `soresu-form/web/form/edit/EditComponent.jsx` — `sizeClassName()` method returns size string as CSS class

## Form Editor (Virkailija)

URL: `/admin/form-editor?avustushaku={id}`

The form editor at `va-virkailija/web/va/hakujen-hallinta-page/haku-details/` provides:
- **Visual editor**: WYSIWYG-style editing of form elements (add/remove/reorder fields, edit labels)
- **JSON editor**: Raw JSON textarea at the bottom of the page (click "JSON editoriin" button to reveal it). Label: "Hakulomakkeen sisältö"
- **Save**: Click "Tallenna" button to persist changes. Timestamp shown as "Päivitetty: ..."
- **Preview**: "Hakulomakkeen esikatselu" links (Suomeksi/Ruotsiksi) open the applicant-facing form preview

Form JSON API: `GET /api/avustushaku/{id}/form` returns the full form definition with `content`, `rules`, `created_at`, `updated_at`.

## Togglable Fieldsets

A fieldset can be toggled by a radio button. The pattern is:
```json
{
  "fieldType": "theme",
  "children": [
    {"fieldType": "radioButton", "id": "some-radio"},
    {"fieldType": "fieldset", "id": "togglable-wrapper-xxx", "children": [...]}
  ]
}
```
When the radio button value is "yes"/"Kyllä", the fieldset children become visible. The fieldset id typically starts with `togglable-wrapper-`.

