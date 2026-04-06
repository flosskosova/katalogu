import type { Tool } from "@/lib/types";

/**
 * One-line notes: common Windows / macOS / commercial stacks readers often
 * replace with this FOSS option. Slugs omitted when no clear analogy exists.
 */
export const proprietaryAlternativeNotesBySlug: Partial<Record<string, string>> =
  {
    "7-zip":
      "Often used instead of WinRAR (paid), Windows’ built-in ZIP, and macOS Archive Utility for formats like 7z and tighter compression.",
    "apache-ant":
      "Legacy Java build alternative where teams might otherwise rely on IDE-only wizards or paid Gradle Enterprise extras.",
    "apache-netbeans":
      "IDE alternative to IntelliJ IDEA (paid tiers), Eclipse distributions with commercial add-ons, and Visual Studio for Java-centric shops.",
    "apache-openoffice":
      "Office alternative to Microsoft 365 / Office on Windows and macOS; less marketed today than LibreOffice but same broad role.",
    audacity:
      "Audio editor alternative to Adobe Audition, GarageBand for quick edits, and many paid podcast tools.",
    avidemux:
      "Quick-cut tool alternative to Adobe Media Encoder segments or QuickTime trims without a full Premiere/Final Cut license.",
    ansible:
      "Automation alternative to Red Hat Satellite bundles, Chef Automate, Puppet Enterprise, and SolarWinds-style config products.",
    "arch-linux":
      "Rolling OS alternative to Windows and macOS for users who want bleeding-edge open packages and manual tuning.",
    ardour:
      "DAW alternative to Pro Tools, Logic Pro, and Cubase for recording and mixing under an open license.",
    "bigbluebutton":
      "Virtual classroom alternative to Zoom Webinar, Microsoft Teams live events, and Adobe Connect when self-hosted.",
    bitwarden:
      "Password manager alternative to 1Password, LastPass, Dashlane, and cross-platform use vs Apple Keychain alone.",
    blender:
      "3D suite alternative to Autodesk Maya, 3ds Max, Cinema 4D, and parts of Adobe’s motion/3D tooling.",
    bleachbit:
      "Cleanup utility alternative to CCleaner and similar “PC cleaner” apps—always review what will be removed.",
    clamav:
      "Malware scanning alternative to Windows Defender on servers, Symantec Mail Security, and macOS consumer AV in mail/file pipelines.",
    borgbackup:
      "Deduplicated backup alternative to Acronis True Image, Macrium Reflect paid features, and some CrashPlan SMB offerings.",
    brackets:
      "Editor alternative in spirit to VS Code, Sublime Text (paid), and legacy Dreamweaver for web front-end work (prefer maintained forks).",
    caddy:
      "Web/reverse-proxy alternative to Microsoft IIS, nginx Plus-style automation, and hardware ADCs for many TLS-terminated sites.",
    cmake:
      "Build system alternative to hand-maintained Visual Studio .sln files and Xcode projects for cross-platform native code.",
    codeblocks:
      "C/C++ IDE alternative to Visual Studio (workload), CLion (paid), and Xcode for teaching and small native projects.",
    containerd:
      "Runtime alternative to Docker’s embedded runtime story and some VMware Tanzu container layers under the hood.",
    "collabora-online":
      "Browser office alternative to Microsoft 365 web apps and Google Docs when paired with self-hosted storage.",
    couchdb:
      "Document/sync database alternative to Firebase Realtime Database and proprietary mobile-sync backends you self-host.",
    "crystaldisk-info":
      "SMART viewer alternative to Hard Disk Sentinel (paid) and third-party macOS SMART utilities.",
    "crystaldisk-mark":
      "Benchmark alternative to AS SSD, ATTO (paid tiers), and Blackmagic Disk Speed Test for quick synthetic storage scores.",
    darktable:
      "RAW developer alternative to Adobe Lightroom and Capture One on Linux, macOS, and Windows.",
    debian:
      "Operating system alternative to Windows and macOS on PCs and servers when you want a community GNU/Linux stack.",
    deluge:
      "BitTorrent client alternative to µTorrent ad builds, BitTorrent-branded clients, and some paid download managers.",
    "delta-chat":
      "Messaging alternative to WhatsApp Business, Telegram, and Signal for email-account-based chat.",
    duplicati:
      "Backup alternative to CrashPlan Home (discontinued), Acronis GUI backups, and some Retrospect tiers with a friendly UI.",
    digikam:
      "Photo DAM alternative to Adobe Bridge, Apple Photos power workflows, and Lightroom Classic’s library module.",
    dosbox:
      "DOS environment alternative to maintaining vintage PCs solely to run classic games and demos you legally use.",
    drupal:
      "CMS alternative to Adobe Experience Manager (mid-market slice), Sitecore, and proprietary portal platforms.",
    "eclipse-ide":
      "Java IDE alternative to IntelliJ IDEA (Ultimate), Visual Studio with Java extensions, and Oracle JDeveloper stacks.",
    element:
      "Team chat alternative to Slack, Microsoft Teams (chat), and Discord for Matrix-based organizations.",
    "equalizer-apo":
      "System EQ alternative to Boom 3D (paid) and some OEM audio control panels on Windows.",
    etherpad:
      "Collaborative pad alternative to Google Docs (lightweight slice) and Confluence simultaneous editing for quick notes.",
    fedora:
      "OS alternative to Windows and macOS desktops/servers when you want newer open components with Red Hat ecosystem ties.",
    fd:
      "File finder alternative to Windows `where`/`dir` patterns and slow GUI searches for dev trees.",
    bat:
      "Cat-with-syntax alternative to plain `type` on Windows CMD and basic macOS `cat` for reading files in a terminal.",
    fzf:
      "Fuzzy finder alternative to Spotlight-only workflows and paywalled launcher utilities for shell history and files.",
    ffmpeg:
      "Media pipeline alternative to Adobe Media Encoder scripting, Telestream Episode, and many closed transcoders.",
    "filezilla-server":
      "File server alternative to WS_FTP Server (paid) and IIS FTP for internal FTP/SFTP drops.",
    filezilla:
      "FTP/SFTP client alternative to CuteFTP, legacy FlashFXP, and Fetch on macOS.",
    floorp:
      "Browser alternative to Chrome, Microsoft Edge, and Safari with Firefox-based hardening choices.",
    forgejo:
      "Git hosting alternative to GitHub Enterprise, GitLab Ultimate, and Bitbucket Data Center on your own infra.",
    freecad:
      "Parametric CAD alternative to SolidWorks, Fusion 360 (commercial), and AutoCAD for mechanical-style work (expect workflow gaps).",
    freeplane:
      "Mind mapping alternative to MindManager (paid), XMind paid features, and MindNode for offline maps.",
    "f-droid":
      "App store alternative to Google Play for open-source Android software.",
    firefox:
      "Browser alternative to Google Chrome, Microsoft Edge, and Apple Safari for everyday use.",
    ghost:
      "Publishing alternative to WordPress.com paid tiers, Squarespace, and Substack when you own the stack.",
    gitea:
      "Light Git hosting alternative to GitHub Team, Bitbucket Cloud paid seats, and GitLab for small self-hosted forges.",
    gimp:
      "Raster editor alternative to Adobe Photoshop for many tasks (different UI and plugin ecosystem).",
    git:
      "Version control alternative to Perforce Helix, Plastic SCM, and legacy Team Foundation for most new projects.",
    "gitlab-ce":
      "DevOps/Git alternative to GitHub Enterprise, Azure DevOps, and Bitbucket for self-hosted teams.",
    gnupg:
      "OpenPGP alternative to commercial Outlook encryption add-ons and some S/MIME-only suites.",
    godot:
      "Engine alternative to Unity and Unreal Engine for many indie 2D/3D games under open terms.",
    gparted:
      "Partitioning alternative to Windows Disk Management for rescue layouts and paid partition-tool boot disks.",
    grafana:
      "Dashboards alternative to Datadog dashboards, New Relic Insights, and Splunk Enterprise visualizations when paired with Prometheus.",
    greenshot:
      "Screenshots alternative to Snagit (paid), Snip & Sketch workflows, and macOS Grab for annotated captures.",
    "gnu-octave":
      "Numerics alternative to MATLAB for teaching and scripts (toolboxes and performance differ).",
    geany:
      "Light IDE alternative to Sublime Text (paid), TextMate, and Notepad for small multi-language projects.",
    handbrake:
      "Transcode alternative to Adobe Media Encoder presets, Apple Compressor (paid), and shrink-wrap DVD rippers.",
    helix:
      "Terminal editor alternative to Sublime Text (paid), VS Code in SSH, and BBEdit for modal editing without Vimscript.",
    "home-assistant":
      "Smart home alternative to Apple Home, Google Home, Alexa-only routines, and Samsung SmartThings cloud dependence.",
    hugo:
      "Static sites alternative to Webflow exports, Squarespace dev modes, and hosted CMS rent for simple sites.",
    immich:
      "Photo library alternative to Google Photos, iCloud Photos, and Amazon Photos when you self-host.",
    immortalwrt:
      "Router firmware alternative to vendor stock firmware and some Merlin/ASUS closed features for supported hardware.",
    infrarecorder:
      "Disc burning alternative to Roxio Toast (paid history) and older Nero bundles on Windows.",
    inkscape:
      "Vector tool alternative to Adobe Illustrator and Affinity Designer for SVG-centric design.",
    "info-zip":
      "ZIP utilities alternative to PKZIP commercial builds and minimal Windows zip for scripting on Unix-like systems.",
    jabref:
      "References alternative to EndNote, Papers (paid), and Zotero for BibTeX-first libraries.",
    jellyfin:
      "Media server alternative to Plex Pass, Emby premiere features, and vendor-locked streaming boxes.",
    jenkins:
      "CI/CD alternative to GitHub Actions runners (managed), Azure Pipelines, Bamboo, and TeamCity (paid).",
    joplin:
      "Notes alternative to Evernote, Microsoft OneNote, Apple Notes (cross-platform), and Notion for local-first capture.",
    jupyter:
      "Notebooks alternative to MATLAB Live Editor, Mathematica notebooks, and Databricks for exploratory analysis.",
    keepass:
      "Vault alternative to 1Password, LastPass, and Apple Keychain when you want classic KeePass database files.",
    keepassxc:
      "Password manager alternative to 1Password, LastPass, and browser-only password sync.",
    kdenlive:
      "NLE alternative to Adobe Premiere Pro, Final Cut Pro, and iMovie for timeline editing.",
    kicad:
      "PCB CAD alternative to Altium Designer, Autodesk Eagle, and OrCAD for many hobby and SMB boards.",
    krita:
      "Painting alternative to Adobe Photoshop, Clip Studio Paint, and Corel Painter for brush-heavy work.",
    kubernetes:
      "Orchestration alternative to VMware-centric VM sprawl, commercial PaaS lock-in, and cloud-only schedulers when you need portability.",
    lazarus:
      "RAD alternative to Delphi (paid) and legacy Visual Basic for maintaining Object Pascal desktop apps.",
    libreoffice:
      "Office suite alternative to Microsoft 365 / Office (Word, Excel, PowerPoint, etc.) on Windows and macOS.",
    librewolf:
      "Browser alternative to Chrome, Edge, and Safari with Firefox-based privacy defaults.",
    "llama-cpp":
      "Local LLM alternative to OpenAI, Anthropic, and Google cloud APIs when you run models on your hardware.",
    lmms:
      "Music alternative to FL Studio (paid), GarageBand (macOS), and Ableton tiers for MIDI and beats.",
    logseq:
      "PKM alternative to Roam Research (paid), Obsidian (with paid sync), and Notion for outline-first notes.",
    mariadb:
      "SQL alternative to Oracle MySQL enterprise offerings and Microsoft SQL Server for typical web stacks.",
    mattermost:
      "Chat alternative to Slack and Microsoft Teams for self-hosted team messaging.",
    meld:
      "Diff/merge alternative to Beyond Compare (paid), Kaleidoscope (macOS paid), and Araxis Merge.",
    minetest:
      "Sandbox alternative to Minecraft Java/Bedrock for creative servers and Lua modding.",
    "mingw-w64":
      "GCC toolchain alternative to Microsoft Visual C++ Build Tools alone when you need POSIX-style builds on Windows.",
    minio:
      "Object storage alternative to Amazon S3 appliances and some Azure Blob gateways when self-hosted.",
    moodle:
      "LMS alternative to Canvas (hosted), Blackboard Learn, and Google Classroom.",
    mpv:
      "Player alternative to VLC, QuickTime, Windows Media Player, and IINA (macOS) for scriptable playback.",
    musescore:
      "Notation alternative to Sibelius, Finale, and Dorico (paid) for scores and band parts.",
    mypaint:
      "Painting alternative to Corel Painter (paid) and Photoshop brushes for tablet sketching.",
    neovim:
      "Editor alternative to Visual Studio as a text surface, Sublime Text, and TextMate for modal editing.",
    "notepad-plus-plus":
      "Editor alternative to Windows Notepad, TextEdit (plain mode), and paid Notepad replacements for logs and configs.",
    nsis:
      "Installer authoring alternative to InstallShield, Advanced Installer (paid), and WiX complexity for Windows setup.exe.",
    newpipe:
      "YouTube experience alternative to the official app; respect Google’s terms and local law.",
    nextcloud:
      "Cloud files alternative to Dropbox, Google Drive, iCloud Drive, and OneDrive when self-hosted.",
    nginx:
      "HTTP server alternative to Microsoft IIS, paid support bundles around Apache, and some hardware load balancers.",
    nmap:
      "Network discovery alternative to commercial vulnerability scanners’ first-pass inventory (scan only what you own).",
    nvda:
      "Screen reader alternative to JAWS and ZoomText on Windows.",
    "obs-studio":
      "Live video alternative to vMix (paid), XSplit (paid), and Streamlabs Desktop for streaming and recording.",
    ollama:
      "Local models alternative to ChatGPT, Claude, and Gemini cloud APIs for on-machine experimentation.",
    onlyoffice:
      "Docs alternative to Microsoft 365 real-time editing and Google Workspace when you self-host.",
    openproject:
      "PM alternative to Microsoft Project Server, Jira + paid portfolio plugins, and Smartsheet for classic views.",
    openscad:
      "Parametric CAD alternative to Fusion 360 sketch modes and some SolidWorks entry paths for code-defined models.",
    openssh:
      "Remote access alternative to SecureCRT, MobaXterm (paid extras), and legacy telnet for shells and scp/sftp.",
    openssl:
      "TLS/crypto building block alternative to proprietary FIPS modules and Windows SCHANNEL-only integrations (varies by app).",
    opentofu:
      "IaC alternative to Terraform where BSL license changes affect procurement; compare to Pulumi (paid tiers) too.",
    orca:
      "Linux accessibility alternative to VoiceOver on macOS and limited Windows Narrator scenarios on GNOME.",
    osmand:
      "Maps alternative to Google Maps offline gaps, Apple Maps, and Garmin paid map packs on phones.",
    "paperless-ngx":
      "Paperless office alternative to Evernote (paid), Adobe Document Cloud filing, and Neat’s scanner ecosystem.",
    pcsx2:
      "Gaming alternative to PS2 hardware for discs you legally own and BIOS you legally obtain.",
    pidgin:
      "Chat client alternative to Trillian (paid era), Adium (macOS), and many single-network proprietary clients.",
    plane:
      "Issues alternative to Linear (paid), Asana, and Monday.com for self-hosted lightweight boards.",
    podman:
      "Containers alternative to Docker Desktop subscription on macOS/Windows and some VM-heavy dev setups.",
    postgresql:
      "Database alternative to Oracle Database, Microsoft SQL Server, and IBM Db2 for transactional workloads.",
    "portableapps-platform":
      "Portable habits alternative to paid portable-app suites and loose USB installers.",
    prometheus:
      "Metrics alternative to Datadog, New Relic, and Splunk metrics slices when you self-host monitoring.",
    projectlibre:
      "Gantt desktop alternative to Microsoft Project for file-based schedules and imports.",
    pytorch:
      "ML alternative to commercial deep-learning platforms and TensorFlow for research and products.",
    putty:
      "SSH alternative to SecureCRT, MobaXterm, and graphical clients for Windows-centric admins.",
    qbittorrent:
      "Torrent alternative to µTorrent adware builds and BitTorrent Inc. clients.",
    rednotebook:
      "Journal alternative to Day One (paid), Journey, and macOS Diary apps for offline dated entries.",
    "r-project":
      "Stats alternative to SAS, SPSS, and Stata for many analyses (support contracts differ).",
    restic:
      "Backup alternative to Arq (paid), Backblaze restore flows, and Apple Time Machine for encrypted snapshots.",
    ripgrep:
      "Search alternative to Windows findstr, classic grep, and slow IDE-wide search on huge trees.",
    rocketchat:
      "Chat alternative to Slack, Microsoft Teams, and Google Chat when self-hosted.",
    "rocky-linux":
      "Server OS alternative to Red Hat Enterprise Linux subscriptions and Windows Server for RHEL-compatible apps.",
    rust:
      "Systems language alternative to MSVC-only C++ stacks and some paid static analyzers for safer native code.",
    saltstack:
      "Config management alternative to Ansible Tower (paid), Chef Automate, and Puppet Enterprise for event-driven fleets.",
    scribus:
      "Layout alternative to Adobe InDesign and QuarkXPress for newsletters, PDFs, and print.",
    "scrollout-f1":
      "Mail gateway alternative to Mimecast slices and Barracuda appliances for self-hosted filtering.",
    "safe-exam-browser":
      "Exam lockdown alternative to Respondus LockDown Browser (paid) and similar proctoring browsers.",
    seafile:
      "Sync/share alternative to Dropbox, Box, and Egnyte for self-hosted team files.",
    signal:
      "Messaging alternative to WhatsApp, Facebook Messenger, and iMessage when you need cross-platform private chat.",
    smplayer:
      "Playback alternative to VLC’s UI, Windows Movies & TV, and bare mpv for remembered settings and subtitles.",
    sqlite:
      "Embedded SQL alternative to Microsoft Access for many app bundles, and to FileMaker for lighter use cases.",
    stella:
      "Atari 2600 alternative to original hardware and closed emulators for preservation and dev.",
    strawberry:
      "Music library alternative to Apple Music (local files), Windows Media Player, and foobar2000.",
    scite:
      "Light editor alternative to Notepad, TextEdit, and trial TextPad for Scintilla-based coding.",
    shotcut:
      "Video editor alternative to Adobe Premiere Elements, iMovie (simpler slice), and Corel VideoStudio for timeline cuts.",
    "sumatra-pdf":
      "PDF reader alternative to Adobe Acrobat Reader DC, Foxit Reader paid features, and slow viewers on Windows.",
    "super-tux-kart":
      "Kart game alternative to Mario Kart for LAN parties under an open license.",
    "sweet-home-3d":
      "Interior planning alternative to SketchUp Pro (paid), RoomSketcher, and Chief Architect for non-pros.",
    syncthing:
      "Sync alternative to Dropbox, iCloud Drive, Resilio (non-FOSS), and OneDrive for direct device sync.",
    taiga:
      "Agile alternative to Jira, Azure Boards, and Asana for self-hosted Scrum/Kanban.",
    thunderbird:
      "Mail alternative to Microsoft Outlook, Apple Mail, and web-only Gmail for desktop IMAP/JMAP.",
    "tor-browser":
      "Privacy-focused browsing alternative to Chrome, Safari, and Edge when you need Tor routing—not a full daily driver for all sites.",
    traefik:
      "Ingress/reverse-proxy alternative to F5 BIG-IP APM slices, Kemp (paid), and cloud vendor L7 gateways for many K8s setups.",
    tortoisegit:
      "Git GUI alternative to GitHub Desktop, GitKraken (paid), and SourceTree from Windows Explorer.",
    tortoisesvn:
      "Subversion GUI alternative to Cornerstone (macOS paid) and raw svn.exe for shell workflows.",
    "trilium-notes":
      "Notes alternative to Notion, Obsidian (sync), and OneNote for self-hosted hierarchies.",
    transmission:
      "Torrent alternative to µTorrent, BitTorrent-branded clients, and heavy “download managers.”",
    turbovnc:
      "Remote display alternative to TeamViewer (paid), AnyDesk, and Splashtop for VNC-style access.",
    ubuntu:
      "Desktop/server OS alternative to Windows and macOS with strong community and LTS support.",
    ubuntuzilla:
      "Firefox/Thunderbird packaging alternative to Ubuntu Snap-only defaults and vendor PPAs for upstream Mozilla builds.",
    "ungoogled-chromium":
      "Chromium browser alternative to Google Chrome and Microsoft Edge when you want fewer Google service hooks.",
    valkey:
      "In-memory data alternative to Redis Enterprise (paid features) and proprietary cache appliances.",
    vaultwarden:
      "Password backend alternative to 1Password Teams, LastPass Business, and Bitwarden’s hosted SaaS when you self-host compatible clients.",
    ventoy:
      "USB boot alternative to YUMI (mixed-license) and paid multiboot sticks for ISO collections.",
    virtualgl:
      "Remote GPU alternative to Teradici/HP Anyware-style remoting and some Citrix 3D slices for Linux workstations.",
    vlc:
      "Player alternative to Windows Media Player, QuickTime, Apple TV app file open, and PowerDVD for codec breadth.",
    vscodium:
      "Editor alternative to Visual Studio Code (Microsoft build), Sublime Text (paid), and WebStorm for a telemetry-stripped VS Code.",
    "warzone-2100":
      "RTS alternative to Age of Empires (commercial) and StarCraft for LAN-friendly open strategy.",
    windirstat:
      "Disk usage alternative to TreeSize Professional (paid), DaisyDisk (macOS paid), and WinDirStat clones.",
    winmerge:
      "Diff alternative to Beyond Compare (paid) and Araxis Merge for Windows file/folder compares.",
    winscp:
      "SFTP/SCP alternative to CuteFTP, Fetch, and Cyberduck (donation) for Windows file transfer.",
    wireguard:
      "VPN alternative to Cisco AnyConnect, proprietary SSL VPN clients, and legacy IPsec GUI suites.",
    wireshark:
      "Packet capture alternative to OmniPeek (paid), Savvius, and some closed network analyzers.",
    "woodpecker-ci":
      "CI alternative to GitHub Actions (self-hosted), Drone Enterprise, and CircleCI for container-native pipelines.",
    wordpress:
      "Site alternative to Squarespace, Wix, and Webflow for self-hosted publishing.",
    xampp:
      "Local stack alternative to MAMP PRO (paid) and IIS + manual PHP install for Windows/macOS dev AMP stacks.",
    xournalpp:
      "Notes/PDF markup alternative to GoodNotes (paid), Notability (paid), and OneNote with a stylus.",
    zeroad:
      "RTS alternative to Age of Empires and commercial historical RTS for open-source LAN play.",
    zabbix:
      "Monitoring alternative to SolarWinds NPM, PRTG (paid sensors), and Datadog infrastructure for classic IT metrics.",
    zulip:
      "Chat alternative to Slack threads, Microsoft Teams channels, and Twist for self-hosted async-friendly chat.",
  };

export function withProprietaryAlternativeNote<T extends Tool>(tool: T): T {
  const existing = tool.replacesProprietary?.trim();
  if (existing) return tool;
  const fromMap = proprietaryAlternativeNotesBySlug[tool.slug];
  if (!fromMap?.trim()) return tool;
  return { ...tool, replacesProprietary: fromMap };
}
