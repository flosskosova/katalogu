import type { Category } from "@/lib/types";

export const categories: Category[] = [
  {
    slug: "operating-systems",
    name: "Operating Systems",
    summary: "Linux distributions and BSD systems for desktop, server, and specialized roles.",
    description:
      "Stable, community-governed operating systems with transparent development and long-term support paths. Prefer conservative releases for servers and well-supported desktops for daily use.",
  },
  {
    slug: "web-browsers",
    name: "Web Browsers",
    summary: "User agents for the open web with strong privacy and standards alignment.",
    description:
      "Browsers that keep the web interoperable. Engine diversity matters; privacy hardening and transparent builds are editorial positives.",
  },
  {
    slug: "office-productivity",
    name: "Office & Productivity",
    summary: "Documents, spreadsheets, and presentations without proprietary lock-in.",
    description:
      "Offline-first suites and self-hosted collaboration for teams that need real document fidelity and data sovereignty. Fast viewers such as Sumatra PDF sit alongside full editors when you only need to read.",
  },
  {
    slug: "notes-knowledge",
    name: "Notes & Knowledge",
    summary: "Markdown notes, PKM, and self-hosted knowledge bases.",
    description:
      "Tools for capturing ideas and building a second brain—local-first options with optional sync you control. Journals (RedNotebook), mind maps (Freeplane), stylus notes (Xournal++), and bibliography (JabRef) cover research-shaped workflows.",
  },
  {
    slug: "communication",
    name: "Communication & Collaboration",
    summary: "Chat, federated messaging, and team collaboration platforms.",
    description:
      "Open protocols and self-hostable stacks for teams that outgrow closed silos—matrix, team chat, and secure messaging. Multi-protocol desktops like Pidgin still matter where IRC, XMPP, and plugin ecosystems overlap.",
  },
  {
    slug: "email",
    name: "Email",
    summary: "Desktop and mobile clients for open standards (IMAP/JMAP).",
    description:
      "Reliable mail clients with extension ecosystems and practical enterprise adoption.",
  },
  {
    slug: "file-sync-storage",
    name: "File Sync & Storage",
    summary: "Peer sync, self-hosted clouds, and object storage APIs.",
    description:
      "From Syncthing’s device-to-device model to full collaboration suites like Nextcloud.",
  },
  {
    slug: "media-players",
    name: "Media Players",
    summary: "Playback engines for local and streaming media with broad codec support.",
    description:
      "VLC-class reliability and mpv-class quality for power users and embedded pipelines. Front ends such as SMPlayer add remembered settings and subtitle workflows on top of mpv/MPlayer backends.",
  },
  {
    slug: "developer-tools",
    name: "Developer Tools",
    summary: "Languages, compilers, Git, and everyday engineering utilities.",
    description:
      "The backbone of software development: version control, search, runtimes, and systems tooling. CMake ties native builds together; NSIS ships Windows installers; Meld and WinMerge visualize diffs; Lazarus keeps Object Pascal RAD alive for desktop tools.",
  },
  {
    slug: "ides-editors",
    name: "IDEs & Editors",
    summary: "Code editors and integrated development environments.",
    description:
      "From keyboard-first Neovim to VS Code’s extension ecosystem—choose by workflow and governance needs. Native stacks such as Notepad++, Geany, SciTE, Code::Blocks, Eclipse, and Apache NetBeans remain staples beside Electron-based editors.",
  },
  {
    slug: "version-control-devops",
    name: "Version Control & DevOps",
    summary: "Git hosting, CI/CD, and infrastructure automation under open licenses.",
    description:
      "Self-hosted forges, automation servers, and OSI-licensed infrastructure-as-code after ecosystem license shifts. Explorer-integrated clients like TortoiseGit lower the barrier for Git on Windows.",
  },
  {
    slug: "containers-virtualization",
    name: "Containers & Virtualization",
    summary: "OCI containers, Kubernetes, and virtualization stacks.",
    description:
      "Cloud-native operations and local dev environments with open, portable standards.",
  },
  {
    slug: "databases",
    name: "Databases",
    summary: "Relational, document, and embedded databases with clear FOSS licensing.",
    description:
      "PostgreSQL-class reliability, SQLite-class simplicity, and CouchDB-style replication when that fits.",
  },
  {
    slug: "security-privacy",
    name: "Security & Privacy",
    summary: "Encryption, analysis, and foundational TLS/crypto libraries.",
    description:
      "Defensive tooling with long maintenance histories and professional review cultures. ClamAV and Nmap anchor server scanning and sanctioned audits; BleachBit helps reduce local forensic surface when used carefully.",
  },
  {
    slug: "password-managers",
    name: "Password Managers",
    summary: "Encrypted credential storage with sync and self-host options.",
    description:
      "Offline-first vaults and Bitwarden-compatible servers for teams that need control.",
  },
  {
    slug: "networking",
    name: "Networking & Remote Access",
    summary: "SSH, VPNs, HTTP servers, and essential networking utilities.",
    description:
      "Production-grade connectivity: OpenSSH everywhere, WireGuard tunnels, nginx and curl as primitives. Classic file moves use FileZilla (client or server) and PuTTY-era SSH; legal torrent stacks include Transmission and Deluge; VirtualGL covers GPU-forwarded remote sessions.",
  },
  {
    slug: "self-hosting",
    name: "Self-Hosting & Homelab",
    summary: "Automation, media, DNS filtering, and dashboards you run yourself.",
    description:
      "Home Assistant, Jellyfin, Pi-hole—real software for real homes and small orgs.",
  },
  {
    slug: "video-tools",
    name: "Video Tools",
    summary: "Streaming, editing, and transcoding with open pipelines.",
    description:
      "OBS for live production, Kdenlive/Shotcut for editing, FFmpeg underneath it all. HandBrake and Avidemux handle batch transcodes and quick trims without a full NLE.",
  },
  {
    slug: "graphics-design",
    name: "Graphics & Design",
    summary: "Raster, vector, and digital painting without subscription suites.",
    description:
      "GIMP, Inkscape, and Krita cover most creative workflows that refuse proprietary lock-in. MyPaint emphasizes brushes; Greenshot and Scribus extend capture and print-ready layout respectively.",
  },
  {
    slug: "photography",
    name: "Photography",
    summary: "RAW development, DAM workflows, and batch processing.",
    description:
      "darktable and RawTherapee for non-destructive RAW; digiKam when libraries matter.",
  },
  {
    slug: "3d-cad",
    name: "3D, CAD & Modeling",
    summary: "3D creation, CAD, and PCB design under open licenses.",
    description:
      "Blender for 3D, FreeCAD for mechanical CAD, KiCad for hardware design. Sweet Home 3D fills interior floor-plan and walkthrough needs without a full BIM stack.",
  },
  {
    slug: "audio-tools",
    name: "Audio Tools",
    summary: "Editing, DAW workflows, and music production.",
    description:
      "Audacity for fast edits; Ardour and LMMS when music production is the goal. MuseScore covers notation, playback, and printed parts for bands and classrooms.",
  },
  {
    slug: "data-science",
    name: "Data Science",
    summary: "Notebooks, numerical Python, and statistical computing.",
    description:
      "Jupyter, pandas, and the SciPy stack for reproducible analysis and teaching. GNU Octave remains the MATLAB-compatible workhorse for numerical courses and quick prototypes.",
  },
  {
    slug: "ai-ml",
    name: "AI & Machine Learning",
    summary: "Frameworks and inference tooling with transparent licenses.",
    description:
      "PyTorch and TensorFlow for training; local inference tools where privacy matters.",
  },
  {
    slug: "automation",
    name: "Automation & Scripting",
    summary: "Config management, shell automation, and glue languages.",
    description:
      "Ansible for fleets; Python and Bash for everything else. Apache Ant still maintains huge legacy Java build.xml forests when migration is not yet justified.",
  },
  {
    slug: "project-management",
    name: "Project Management",
    summary: "Issues, boards, and roadmaps you can self-host.",
    description:
      "OpenProject and Plane-style tools for software teams that need data on-prem. Desktop Gantt suites like ProjectLibre still matter for file-based interchange with proprietary PPM tools.",
  },
  {
    slug: "cms-websites",
    name: "CMS & Website Platforms",
    summary: "Publishing from blogs to enterprise portals.",
    description:
      "WordPress and Drupal for different complexity levels; Ghost and Strapi for specialized stacks.",
  },
  {
    slug: "education",
    name: "Education & Learning",
    summary: "LMS and virtual classroom infrastructure.",
    description:
      "Moodle for courses; BigBlueButton for live teaching workflows.",
  },
  {
    slug: "accessibility",
    name: "Accessibility",
    summary: "Assistive technology on the open stack.",
    description:
      "NVDA on Windows; Orca on Linux—FOSS AT is uneven vs proprietary leaders but essential.",
  },
  {
    slug: "mobile",
    name: "Mobile Apps",
    summary: "FOSS Android apps and open distribution (F-Droid).",
    description:
      "iOS constraints limit FOSS distribution; Android is where open mobile software thrives.",
  },
  {
    slug: "gaming",
    name: "Gaming & Game Development",
    summary: "Game engines and notable open games.",
    description:
      "Godot leads for indie FOSS game development; content pipelines often pair with Blender. Emulators such as PCSX2, DOSBox, and Stella preserve console and DOS history; Luanti (Minetest) and Warzone 2100 show active open game communities.",
  },
  {
    slug: "system-utilities",
    name: "System Utilities",
    summary: "Archives, disks, benchmarks, and terminal productivity.",
    description:
      "7-Zip-class archivers, GParted for partition edits, WinDirStat-style treemaps, CrystalDiskMark for quick storage numbers, plus ripgrep, fd, and bat—small tools that save hours weekly. Optical helpers like InfraRecorder remain for rare disc workflows.",
  },
  {
    slug: "backup-recovery",
    name: "Backup & Recovery",
    summary: "Encrypted, deduplicating backups with restore discipline.",
    description:
      "Borg and Restic for serious backup hygiene; Duplicati when you want a GUI.",
  },
  {
    slug: "monitoring",
    name: "Monitoring & Observability",
    summary: "Metrics, logs, dashboards, and enterprise monitoring.",
    description:
      "Prometheus + Grafana stack; Zabbix for classic IT monitoring patterns. Uptime Kuma and Cachet-style status pages fit here too.",
  },
  {
    slug: "finance-accounting",
    name: "Finance & accounting",
    summary: "Invoicing, bookkeeping, and personal finance you can self-host.",
    description:
      "FOSS options beside QuickBooks, FreshBooks, and spreadsheet-only money tracking when you want books on infrastructure you control.",
  },
  {
    slug: "erp-operations",
    name: "ERP & operations",
    summary: "ERP, inventory, POS, and small-business operations suites.",
    description:
      "Community editions and Apache-licensed suites that overlap SAP/NetSuite/Odoo Enterprise mindshare for ops, stock, and invoices.",
  },
  {
    slug: "event-management",
    name: "Event management",
    summary: "Self-hosted ticketing, registration, and event operations.",
    description:
      "Open alternatives to Eventbrite-class hosts when box-office data, fees, and branding must stay on infrastructure you control.",
  },
  {
    slug: "crm-support",
    name: "CRM & customer support",
    summary: "CRM, help desk, ticketing, and shared team inboxes.",
    description:
      "Self-hosted answers to Salesforce, HubSpot, Zendesk, and Intercom when tickets and contacts must stay on-prem or in-region.",
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    summary: "Storefronts, carts, and headless commerce stacks.",
    description:
      "Open alternatives to Shopify, BigCommerce, and Adobe Commerce for merchants who ship their own checkout and catalog code.",
  },
  {
    slug: "web-analytics",
    name: "Web analytics",
    summary: "Privacy-oriented analytics for sites and apps.",
    description:
      "Self-hosted Google Analytics alternatives and lightweight, cookie-conscious metrics aligned with GDPR-minded teams.",
  },
  {
    slug: "forums-community",
    name: "Forums & community",
    summary: "Discussion boards, federated forums, and social hubs.",
    description:
      "Platforms for communities that outgrow Facebook groups and proprietary forum hosts—threaded, searchable, and often self-hosted.",
  },
  {
    slug: "backend-baas",
    name: "Backend as a service",
    summary: "Self-hosted auth, APIs, realtime, and storage backends for applications.",
    description:
      "Firebase-class capabilities on infrastructure you control—users, databases, and serverless hooks without proprietary BaaS lock-in.",
  },
  {
    slug: "document-management",
    name: "Document management",
    summary: "EDMS, scanning workflows, and enterprise file organization.",
    description:
      "Retention, metadata, and search across document lifecycles—alternatives to proprietary ECM when files must stay in your region.",
  },
  {
    slug: "archiving",
    name: "Archiving & digital preservation",
    summary:
      "Digital preservation workflows, archival description, cultural collections, and research repositories.",
    description:
      "Trustworthy long-term stewardship: OAIS-style processing, PREMIS/METS, BagIt transfer, finding aids, GLAM publishing, institutional and data repositories, and web archiving (WARC). Prefer tools with clear standards alignment and documented exit paths from proprietary hosts.",
  },
  {
    slug: "data-integration",
    name: "Data integration",
    summary: "ELT, CDC, and event ingestion into warehouses and lakes.",
    description:
      "Connectors and replication engines for analytics—open stacks that overlap Fivetran, Segment, and proprietary pipeline hosts.",
  },
  {
    slug: "email-newsletters",
    name: "Email newsletters",
    summary: "Mailing lists, campaigns, and transactional-friendly list management.",
    description:
      "Subscriber management and sends under your SMTP policy—useful when marketing lists must not live in closed SaaS silos.",
  },
  {
    slug: "low-code-platforms",
    name: "Low-code platforms",
    summary: "Internal tools, spreadsheet UIs, and rapid CRUD on existing databases.",
    description:
      "Bridges between raw SQL and full custom apps—admin panels and Airtable-style surfaces on open licenses.",
  },
  {
    slug: "surveys-feedback",
    name: "Surveys & feedback",
    summary: "Branching surveys, forms, and product feedback you can self-host.",
    description:
      "Research and NPS-style flows with data residency control—alternatives to Typeform-class hosts for sensitive respondents.",
  },
  {
    slug: "scheduling-booking",
    name: "Scheduling & booking",
    summary: "Public booking pages and appointment flows on your own stack.",
    description:
      "Calendly-style scheduling and service reservations without surrendering calendar data to third-party SaaS defaults.",
  },
  {
    slug: "marketing-automation",
    name: "Marketing automation",
    summary: "Campaigns, segments, and lead nurture on open platforms.",
    description:
      "FOSS stacks that overlap HubSpot and Mailchimp automation while keeping contacts and analytics under your governance.",
  },
  {
    slug: "federated-social",
    name: "Federated social",
    summary: "ActivityPub and open protocols for feeds, photos, and community hubs.",
    description:
      "Self-hosted alternatives to centralized social networks—microblogging, image sharing, and group spaces you can federate.",
  },
  {
    slug: "paas-platforms",
    name: "PaaS & deployment",
    summary: "Self-hosted app platforms with git-style deploys and managed routing.",
    description:
      "Heroku- and Netlify-class ergonomics on your own servers—containers, reverse proxies, and one-click services without proprietary hosts.",
  },
  {
    slug: "it-asset-management",
    name: "IT asset management",
    summary: "Hardware, licenses, and inventory tracking for IT operations.",
    description:
      "CMDB and ITAM workflows that overlap ServiceNow asset modules when asset data must stay on infrastructure you control.",
  },
];
