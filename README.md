# VulnWatch AI

VulnWatch AI is a web application prototype for reviewing exposure on domains a security team manages. It turns service observations, TLS certificate details and HTTP response headers into findings an analyst can prioritize. The Next.js dashboard includes scan history and individual reports with severity and remediation guidance.

## How observations become findings

The TypeScript scanner applies rules to observations. For example, a certificate that expires in fewer than seven days generates a high-severity finding. With OpenAI configured, the analyzer sends domain, service and certificate context plus baseline findings to the model for additional findings and recommendations. If the model call fails or no API key is configured, the analyzer returns its rule-based assessment. Model suggestions and CVE references need analyst verification.

**Illustrative report for portal.example.** Both rows use the project's rules and fictional observations.

| Observation | Reported finding | Analyst action |
| --- | --- | --- |
| The TLS certificate expires in five days. | High · SSL Certificate Expiring Soon | Check renewal and verify the replacement certificate before expiry. |
| The HTTP Server header includes a product version. | Low · Server Version Disclosure | Review whether clients need the version detail when updating the server configuration. |

## Inspect the project

Follow a report through the source directly on GitHub. This path requires no credentials, installed services or network scanning.

| Source | What to look for |
| --- | --- |
| [Scan creation route](app/api/scans/create/route.ts) and [job processor](lib/jobs/scan-processor.ts) | The route creates a record and schedules processing. The processor updates status and saves individual findings. |
| [Scanner](lib/scanner/scanner.ts) and [analyzer](lib/scanner/ai-analyzer.ts) | Observation collection, severity rules and optional OpenAI enrichment. |
| [Prisma schema](prisma/schema.prisma) and [scan dashboard](app/dashboard/scans) | PostgreSQL models for scan history and findings, alongside the list and detail views that read them. |
| [Scan comparison](lib/monitoring/scan-comparison.ts) | How the prototype identifies new, resolved and changed findings across two reports. |

To inspect a local copy with Git:

```sh
git clone https://github.com/NimdaNona/vulnwatch-ai.git
cd vulnwatch-ai
git ls-files app/api/scans lib/scanner prisma app/dashboard/scans
```

## Prototype limits

- The landing-page simulation uses scripted findings. The dashboard overview uses placeholder metrics. The scan history and detail pages fetch stored reports.
- The scan creation route starts work with an in-process timer. A restart can interrupt processing, and this path has no durable queue.
- The root Compose file defines an OpenVAS service. The report processor calls the TypeScript scanner directly. The separate FastAPI entry point mounts Stripe routes and a health endpoint.
