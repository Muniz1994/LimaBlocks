# LimaBlocks

## About

LimaBlocks (LiMA Blocks) is an open-source web application prototype for checking
Building Information Models (IFC) against building permit regulations. Rules
are created in the browser with a **block-based visual programming language**
(built on Google Blockly), using local permit terminology instead of code. The
blocks generate Python, which a backend checking engine runs against an IFC
model to produce a compliance report.

The motivation is that existing compliance checkers rely on hard-coded rules
that are closed and hard to adapt, and that existing visual languages for
permit checking are conceptual or proprietary. LimaBlocks explores an open
alternative in which permit concepts are defined once in a domain model and
rules are composed from blocks on top of them.

### Key ideas

- **Visual rule authoring.** Rules are assembled from blocks that use local
  permit terms, with an editor that also shows the generated Python.
- **Domain model.** Local permit concepts (for example *Parcel*, *Building*,
  *Storey*, *Stair*) are implemented as Python classes and mapped to the IFC
  data model. Mapping strategies are native IFC properties, custom properties,
  classification codes, geometric processing and attributes. Geometric
  processing derives values such as building height, depth or area from the
  geometry, which reduces the number of properties that must be filled in
  manually.
- **Separation of concepts and rules.** New concepts require work on the
  domain model. New rules over existing concepts only require composing blocks.
- **Open technology.** Open-source tools and open formats are used throughout,
  so the whole chain, from rule to result, can be inspected.

## How it works

### Block categories

| Category | Purpose |
| --- | --- |
| Model | Entities and properties of the domain model. Entity blocks loop over all elements of their type. |
| Logic | Conditions and operators (`if` / `else if`), used to filter loops and build checks. |
| Check | `Check` for mandatory conditions with a pass/fail result. `Alert` for conditions that need a subjective analysis when not met. |
| Value | Numerical, textual or categorical values. |
| Math | Arithmetic operations and counting functions. |

### Architecture

- **Frontend** (`lima-frontend-js`): React and Blockly. It holds the rule
  editor, the IFC model viewer and the report views.
- **Backend** (`lima-backend`): Django and a REST API, with SQLite as the
  default database (replaceable, as is usual in Django). It holds the checking
  engine and the domain model.
- **Checking library (`CHECKIFC`)**: loads the IFC model with IfcOpenShell and
  builds meshes with Trimesh, so that elements can be selected and measured.
- **Exchange format**: rules, regulations and reports are serialised as JSON. A
  *regulation* is a set of machine-readable rules with metadata that link it to
  the legal text. Each rule stores its generated Python code and the XML of its
  blocks, so it can be reopened and edited in the editor.

### Workflow

1. **Create rules.** In the editor, assemble blocks, save the rule and group
   rules into a regulation.
2. **Prepare the IFC model.** The model must follow the application's
   information requirements, since the domain model reads its properties,
   classifications and geometry.
3. **Create a verification.** In the *Checking* panel, load the IFC file and
   associate it with one or more regulations.
4. **Execute.** On the compliance check page, run the verification. The backend
   runs each rule's code and collects every atomic check (subject, attribute or
   method, comparison, object) into the report.
5. **Inspect the report.** Results appear in the report panel, and some
   verified elements are highlighted in the viewer.

The interface is available in English and Portuguese.

## Scope

- **Jurisdiction:** Portuguese building permits. The domain model, the rules
  and the use case are based on the national regulation (RGEU) and on the
  municipal plans (PDM) of Vila Nova de Gaia and Lisbon.
- **Implemented rules:** nine clauses from these documents, chosen to cover
  national and municipal scope, text and tabular requirements, and values taken
  from properties, classification and geometry. They represent *types* of
  requirement. They are not a statistical sample of the regulatory framework.
- **Evaluation:** technical only. For three presented rules, run on a model
  based on a real design (10 floors, 20 dwellings), the outcomes agreed with
  independent measurement in a separate viewer. The dwelling areas were
  identical in both tools.
- **Not an overall solution.** LimaBlocks does not interpret regulatory text
  automatically and does not aim to automate every permit check. It provides a
  way to author and run rules that were already interpreted by people.

## Limitations

- **No user evaluation.** Whether municipal technicians can create and maintain
  rules with the visual language has not been tested.
- **No coverage analysis.** It is not known which share of a regulatory corpus
  can be expressed with the existing blocks and domain model.
- **Portuguese concepts only.** Transfer to other jurisdictions is expected from
  the modular design but has not been demonstrated.
- **New concepts need development work.** Extending the domain model requires
  Python development and a multidisciplinary team (programming, BIM and permit
  experts).
- **Model preparation.** IFC models must follow the information requirements.
  Classification coverage is also limited. For example, some room types named in
  the regulations are missing from the Portuguese SECClasS system, so custom
  codes were created.
- **Geometry processing.** The number of ways geometry can be represented in
  IFC makes robust algorithms hard to write. Quantities such as area, height and
  depth depend on how the model was authored.
- **Viewer.** Some measurements, such as areas, are not yet shown graphically in
  the viewer.
- **Rule execution.** Rule code is generated from blocks and run on the server
  in a separate environment. This sandboxing has not been formally evaluated, so
  do not expose an instance to untrusted users without a security review.
- **Prototype status.** The default SQLite database and development settings
  are intended for research and demonstration, not production use.

## Future work

- An evaluation with municipal technicians on the usability of the visual
  language.
- A coverage analysis over a bounded regulatory corpus. Each verifiable clause
  would be classified as expressible with the existing blocks, as requiring a new
  concept in the domain model, or as outside the scope of semantic and geometric
  checking.
- Adapting the domain model to another jurisdiction, to assess transferability.
- More domain model concepts, mappings and geometry processing methods.
- Showing more verified quantities, such as areas, in the viewer.

## Contributing

Issues and pull requests are welcome. Please open an issue first to discuss
substantial changes, especially to the domain model or the block vocabulary.

## Licence

See [`LICENSE`](LICENSE).


Django REST backend (`lima-backend`) and Create React App frontend
(`lima-frontend-js`), run together with Docker Compose.

## Configuration

All ports, hostnames, credentials and secrets live in a **`.env` file at the
repo root**. Nothing configurable is hardcoded in `settings.py`,
`docker-compose.yml` or the Dockerfiles.

```sh
cp .env.example .env
# then edit .env — at minimum set DJANGO_SECRET_KEY
```

`.env` is git-ignored. `.env.example` is the committed reference and documents
every variable together with its default.

Three consumers read the same file:

| Consumer | How it reads `.env` |
| --- | --- |
| Docker Compose | automatically, both for `${VAR}` substitution in `docker-compose.yml` and via `env_file:` for the `api` container |
| Django | `limaBackend/settings.py` loads it with `python-dotenv`, so `python manage.py …` outside Docker sees the same values |
| React dev server | Compose passes `REACT_APP_*` and `PORT` into the `web` container |

Real environment variables always win over the file, so
`DJANGO_SECRET_KEY=… docker compose up` or a CI secret store overrides it
without any code change.

### Changing a port

Set `BACKEND_PORT` / `FRONTEND_PORT` in `.env`. Each one drives the container's
listening port, the published host port, the healthcheck and the CORS origin at
the same time — there is no second place to update.

### Running the frontend outside Docker

`npm start` only reads a `.env` in `lima-frontend-js/`, not the repo root, so
that folder has its own template:

```sh
cd lima-frontend-js
cp .env.example .env
npm start
```

Keep its values in sync with the root file. Note that **only `REACT_APP_*`
names reach the browser bundle, and they ship in cleartext** — never put a
secret in one.

## Running

```sh
docker compose up --build
```

- frontend: `http://localhost:3000` (`FRONTEND_PORT`)
- API: `http://localhost:8000/api/` (`BACKEND_PORT`)

## Secrets

- `.env`, `.env.local` and `.env.*.local` are git-ignored, and both
  `.dockerignore` files exclude them so nothing is baked into an image.
- `DJANGO_SECRET_KEY` is required whenever `DJANGO_DEBUG` is off; under DEBUG a
  throwaway key is generated per process so a fresh clone starts with no setup.
- Wrap values containing `$` in single quotes — otherwise Compose and
  python-dotenv both read them as variable references.
