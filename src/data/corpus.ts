/**
 * Documentation corpus — sample topics
 * Structure mirrors real DITA output converted to Markdown.
 * Each topic carries metadata used by the RAG chunking pipeline.
 */

export interface DocTopic {
  id: string;
  title: string;
  product: string;
  version: string;
  topic_type: "concept" | "task" | "reference" | "troubleshooting";
  audience: "developer" | "admin" | "all";
  tags: string[];
  last_reviewed: string;
  content: string;
}

export const corpus: DocTopic[] = [
  {
    id: "ae-rpm-upgrade-8.0",
    title: "Upgrading Analytics Engine using RPM packages",
    product: "analytics-engine",
    version: "8.0",
    topic_type: "task",
    audience: "admin",
    tags: ["upgrade", "rpm", "installation", "analytics-engine", "8.0"],
    last_reviewed: "2025-03-15",
    content: `# Upgrading Analytics Engine using RPM packages

## Overview

Use this procedure to upgrade an existing Actian Analytics Engine installation using RPM packages on Red Hat Enterprise Linux or compatible distributions.

## Prerequisites

Before you begin:

- You have root or sudo access to the target host
- All databases are backed up
- The Analytics Engine service is stopped
- You have downloaded the RPM package for version 8.0

## Stop existing services

\`\`\`bash
sudo systemctl stop actian-vector
sudo systemctl stop actian-vector-listener
\`\`\`

## Run the upgrade

\`\`\`bash
sudo rpm -Uvh actian-analytics-engine-8.0.x86_64.rpm
\`\`\`

## Silent upgrade

To upgrade without interactive prompts — suited for automated deployments:

\`\`\`bash
sudo rpm -Uvh --quiet actian-analytics-engine-8.0.x86_64.rpm > /var/log/actian-upgrade.log 2>&1
\`\`\`

Check the exit code:

\`\`\`bash
echo $?  # 0 = success
\`\`\`

## Post-upgrade steps

1. Start the Analytics Engine service
2. Verify the version: \`actian-version\`
3. Run the post-upgrade validation script: \`post_upgrade_check.sh\`
`,
  },
  {
    id: "ae-tableau-connector-setup",
    title: "Setting up the Tableau connector for Analytics Engine",
    product: "analytics-engine",
    version: "8.0",
    topic_type: "task",
    audience: "developer",
    tags: ["tableau", "connector", "analytics-engine", "jdbc", "setup"],
    last_reviewed: "2025-04-01",
    content: `# Setting up the Tableau connector for Analytics Engine

## Overview

This topic describes how to configure Tableau Desktop and Tableau Server to connect to Actian Analytics Engine using the JDBC connector.

## Requirements

- Tableau Desktop 2023.1 or later
- Actian Analytics Engine 8.0
- JDBC driver: \`actian-jdbc-8.0.jar\`

## Install the JDBC driver

Copy the JDBC driver to the Tableau drivers directory:

**macOS:**
\`\`\`
~/Library/Tableau/Drivers/
\`\`\`

**Windows:**
\`\`\`
C:\\Program Files\\Tableau\\Drivers\\
\`\`\`

## Create a connection

1. Open Tableau Desktop
2. Select **Connect > More > Other Databases (JDBC)**
3. Enter the connection URL: \`jdbc:ingres://hostname:port/database\`
4. Enter your credentials and click **Sign In**

## Troubleshooting

If Tableau reports "Connector not found after upgrade", verify the driver path and restart Tableau Desktop.
`,
  },
  {
    id: "ae-rename-vector-to-ae",
    title: "Product rename — Actian Vector to Actian Analytics Engine",
    product: "analytics-engine",
    version: "8.0",
    topic_type: "concept",
    audience: "all",
    tags: ["rename", "actian-vector", "migration", "compatibility"],
    last_reviewed: "2025-02-20",
    content: `# Product rename — Actian Vector to Actian Analytics Engine

## Overview

Actian Vector has been renamed to Actian Analytics Engine as of version 8.0. This topic describes what changed and what stayed the same.

## What changed

- Product name in UI, packaging, and documentation
- RPM and installer package names
- Default installation directory prefix

## What stayed the same

- All SQL syntax and query semantics
- All configuration file formats
- All API and JDBC connection strings
- All existing data files and databases

## Migration path

No data migration is required. Existing installations can be upgraded using the standard RPM upgrade procedure.
`,
  },
  {
    id: "ae-performance-tuning-columnar",
    title: "Performance tuning — columnar query optimisation",
    product: "analytics-engine",
    version: "8.0",
    topic_type: "concept",
    audience: "developer",
    tags: ["performance", "columnar", "query", "optimisation", "vectorwise"],
    last_reviewed: "2025-03-10",
    content: `# Performance tuning — columnar query optimisation

## Overview

Actian Analytics Engine uses a columnar storage format that enables high-speed analytics on large datasets. This topic describes key optimisation strategies.

## Columnar storage basics

Data is stored column by column rather than row by row. This means queries that access a subset of columns read only the relevant data, dramatically reducing I/O.

## Structure keys

A structure key is the primary sort order of a table. Choosing the right structure key is the single most impactful performance decision.

Choose a structure key that:
- Matches your most frequent range predicates
- Has high cardinality
- Is used in JOIN conditions

## Partition elimination

Partitioning by date or region allows the engine to skip entire partitions for qualifying queries.

\`\`\`sql
CREATE TABLE sales (
  sale_date DATE,
  region VARCHAR(50),
  amount DECIMAL(10,2)
) WITH PARTITION = (HASH ON region 8 PARTITIONS);
\`\`\`
`,
  },
  {
    id: "ingres-backup-restore",
    title: "Backing up and restoring Ingres databases",
    product: "ingres",
    version: "11.x",
    topic_type: "task",
    audience: "admin",
    tags: ["backup", "restore", "ckpdb", "ingres", "disaster-recovery"],
    last_reviewed: "2025-01-15",
    content: `# Backing up and restoring Ingres databases

## Overview

Use \`ckpdb\` to create online or offline checkpoints of an Ingres database.

## Create a checkpoint

\`\`\`bash
ckpdb dbname
\`\`\`

### Options

| Option | Description |
|--------|-------------|
| \`-l\` | Enable journaling after checkpoint |
| \`-d\` | Create offline (destructive) checkpoint |
| \`-j\` | Disable journaling |

## Restore from checkpoint

\`\`\`bash
rollforwarddb dbname
\`\`\`

This restores the database to the most recent consistent checkpoint, then applies journal records to bring it up to date.
`,
  },
  {
    id: "client-odbc-dsn-windows",
    title: "Configuring an ODBC DSN on Windows — Actian Client",
    product: "actian-client",
    version: "4.2",
    topic_type: "task",
    audience: "developer",
    tags: ["odbc", "dsn", "windows", "connection", "actian-client"],
    last_reviewed: "2025-02-28",
    content: `# Configuring an ODBC DSN on Windows — Actian Client

## Overview

This topic describes how to create an ODBC Data Source Name (DSN) for Actian Client on Windows.

## Open the ODBC Data Source Administrator

1. Press **Win + R**, type \`odbcad32\`, and press Enter
2. Select the **System DSN** tab (for all users) or **User DSN** tab (current user only)
3. Click **Add**

## Configure the DSN

1. Select **Actian Client** from the driver list and click **Finish**
2. Enter a **Data Source Name** (for example, \`ActianDW\`)
3. Enter the **Server** hostname or IP address
4. Enter the **Database** name
5. Click **Test Connection** to verify
6. Click **OK**

## Connection string parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| \`Server\` | Hostname or IP | \`myserver.example.com\` |
| \`Database\` | Database name | \`production_dw\` |
| \`Port\` | TCP port | \`VW7\` |
`,
  },
];

export const topicIndex = new Map(corpus.map((t) => [t.id, t]));
