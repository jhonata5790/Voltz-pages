from pathlib import Path

OPENWORLD_PATH = Path("assets/js/openworld.js")
HTML_PATHS = (Path("game.html"), Path("openworld-test.html"))

DATA_START = "    let buildings = ["
ENEMY_MARKER = "    const enemyTypes = {"
REALM_START = "    const realmOptions = ["
CLONE_MARKER = "    const cloneData = (data) => JSON.parse(JSON.stringify(data));"
BOOTSTRAP_TAG = '  <script src="assets/js/main/data-bootstrap.js" defer></script>\n'


def require_once(text: str, marker: str, filename: str) -> None:
    count = text.count(marker)
    if count != 1:
        raise RuntimeError(
            f"Esperava encontrar {marker!r} exatamente uma vez em {filename}, mas encontrei {count}."
        )


def patch_openworld() -> None:
    text = OPENWORLD_PATH.read_text(encoding="utf-8")

    for marker in (DATA_START, ENEMY_MARKER, REALM_START, CLONE_MARKER):
        require_once(text, marker, str(OPENWORLD_PATH))

    prefix, remainder = text.split(DATA_START, 1)
    _, suffix = remainder.split(ENEMY_MARKER, 1)

    modular_initialization = "\n".join(
        (
            "    const cloneData = (data) => JSON.parse(JSON.stringify(data));",
            "",
            "    const sourceData = window.VoltzData;",
            "",
            "    if (",
            "      !sourceData?.village ||",
            "      !sourceData?.villageNpcs ||",
            "      !sourceData?.villagePortals ||",
            "      !sourceData?.realmOptions",
            "    ) {",
            '      throw new Error("Os dados modulares do mundo não foram carregados antes de openworld.js.");',
            "    }",
            "",
            "    let buildings = cloneData(sourceData.village.buildings);",
            "    let decorObjects = cloneData(sourceData.village.decorObjects);",
            "    let treeObjects = cloneData(sourceData.village.treeObjects);",
            "    let npcObjects = cloneData(sourceData.villageNpcs);",
            "    let portalObjects = cloneData(sourceData.villagePortals);",
            "",
            "",
        )
    )

    text = prefix + modular_initialization + ENEMY_MARKER + suffix

    prefix, remainder = text.split(REALM_START, 1)
    _, suffix = remainder.split(CLONE_MARKER, 1)
    text = prefix + "    const realmOptions = cloneData(sourceData.realmOptions);\n\n" + suffix

    if DATA_START in text:
        raise RuntimeError("O bloco legado de dados da Vila ainda existe.")
    if REALM_START in text:
        raise RuntimeError("O bloco legado de opções de reinos ainda existe.")
    if text.count("const cloneData =") != 1:
        raise RuntimeError("cloneData deveria existir exatamente uma vez após a limpeza.")

    OPENWORLD_PATH.write_text(text, encoding="utf-8")


def patch_html() -> None:
    for path in HTML_PATHS:
        html = path.read_text(encoding="utf-8")
        require_once(html, BOOTSTRAP_TAG, str(path))
        path.write_text(html.replace(BOOTSTRAP_TAG, ""), encoding="utf-8")


def main() -> None:
    patch_openworld()
    patch_html()


if __name__ == "__main__":
    main()
