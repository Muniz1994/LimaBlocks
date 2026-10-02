<img src="lima-frontend-js/src/assets/result.svg" width="256">

# LimaBlocks

LimaBlocks (LiMA Blocks) is an open-source web application for checking
Building Information Models (IFC) against building permit regulations. You
build rules in the browser by snapping together visual blocks (based on Google
Blockly) that use permit terms such as *Parcel*, *Building*, *Storey* or
*Stair*, so you don't need to write code. LimaBlocks then runs those rules
against an IFC model and produces a compliance report.

<p align="center">
  <img src="assets/usage.gif" alt="Usage" width="800">
</p>

The interface is available in English and Portuguese.

## Installation

### Requirements

- [Git](https://git-scm.com/downloads)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker
  Engine with the Compose plugin on Linux)

### 1. Get the code

```sh
git clone https://github.com/Muniz1994/LimaBlocks.git
cd LimaBlocks
```

### 2. Create the configuration file

```sh
cp .env.example .env
```

On Windows (PowerShell) use `Copy-Item .env.example .env`.

For running on your own computer the default values work, so you don't need to
edit anything.

### 3. Start the application

Make sure Docker Desktop is running, then:

```sh
docker compose up --build
```

The first start takes several minutes while Docker downloads and builds
everything. It is ready when the log shows the frontend has compiled.

### 4. Open it

Go to **http://localhost:3000** in your browser.

To stop the application, press `Ctrl+C` in the terminal, or run
`docker compose down`. Next time, `docker compose up` is enough. Your rules,
regulations and uploaded models are kept between runs.

## Using LimaBlocks

1. **Create rules.** Open the rule editor, drag blocks into the workspace and
   save the rule. Group related rules into a *regulation*. The editor also
   shows the Python code that each rule generates.
2. **Prepare the IFC model.** The model must contain the properties,
   classifications and geometry that the rules read. When you upload a model,
   LimaBlocks checks it against these information requirements and tells you
   what is missing.
3. **Create a verification.** In the *Checking* panel, upload the IFC file and
   choose one or more regulations to check it against.
4. **Run the check.** On the compliance check page, run the verification.
5. **Read the report.** Results are listed in the report panel, and some of the
   checked elements are highlighted in the 3D viewer.

Sample IFC models to try it with are in
[`lima-backend/check_engine/CHECKIFC/TestFile`](lima-backend/check_engine/CHECKIFC/TestFile).

### Block categories

| Category | Purpose |
| --- | --- |
| Model | Building elements and their properties. An element block goes through every element of that type. |
| Logic | Conditions (`if` / `else if`) used to filter elements and build checks. |
| Check | `Check` for mandatory conditions with a pass/fail result. `Alert` for conditions that need a person to review them when not met. |
| Value | Numbers, text or categories. |
| Math | Arithmetic and counting. |

## Troubleshooting

- **A port is already in use.** Change `FRONTEND_PORT` or `BACKEND_PORT` in
  `.env`. If you change `BACKEND_PORT`, also update the port in
  `REACT_APP_API_ROOT`. Then run `docker compose up` again.
- **The page loads but shows no data or network errors.** Check that the `api`
  container is running (`docker compose ps`) and that
  http://localhost:8000/api/ opens in the browser.
- **Changes to `.env` have no effect.** Restart with `docker compose down`
  followed by `docker compose up`.

## Scope

LimaBlocks is a research prototype for Portuguese building permits. Its
building concepts and sample rules are based on the national building
regulation (RGEU) and on the municipal plans (PDM) of Vila Nova de Gaia and
Lisbon. It does not interpret regulatory text automatically. It is a tool for
writing and running rules that people have already interpreted.

## Limitations

- **Not tested with users.** It has not yet been tested whether municipal
  technicians can create and maintain rules with the blocks.
- **Unknown coverage.** It is not known what share of a full set of regulations
  can be expressed with the existing blocks and building concepts.
- **Portuguese concepts only.** The design should allow adapting it to other
  countries, but this has not been demonstrated.
- **New concepts need developers.** Adding a new building concept requires
  Python development and a team that combines programming, BIM and permit
  expertise. New rules that use existing concepts only require blocks.
- **Models must be prepared.** IFC models must follow the information
  requirements. Classification is also incomplete: some room types named in the
  regulations are missing from the Portuguese SECClasS system, so custom codes
  were created for them.
- **Geometry depends on how the model was made.** IFC allows geometry to be
  represented in many ways, so measurements such as area, height and depth
  depend on how the model was authored.
- **Viewer.** Some measurements, such as areas, are not yet shown in the 3D
  viewer.
- **Rules run as code on the server.** The blocks generate Python that runs in a
  separate environment on the server. This isolation has not been formally
  evaluated, so do not expose an instance to untrusted users without a security
  review.
- **Not for production.** The default database and settings are meant for
  research and demonstration.

## Contributing

Issues and pull requests are welcome. Please open an issue first to discuss
substantial changes, especially to the building concepts or the blocks.

## Licence

See [`LICENSE`](LICENSE).
