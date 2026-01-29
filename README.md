# Catalog of Attestations

This repository provides a minimal **end-to-end reference implementation** of how to define attestation types, describe their structure, and declare trusted issuers — in a way that is interoperable across the **EU Digital Identity Wallet** ecosystem.

It demonstrates how:

- an **attestation type** is defined,
- the **credential schema** is published,
- a **trust list** declares who may issue it,
- and how wallets/verifiers can discover and validate all of this.

The example attestation is a **Gym Membership Card**, issued as an SD-JWT VC.

## Technical Specifications

This catalog is aligned with two central specifications in the EUDI Wallet reference architecture:

### ARF Technical Specification 11 — Catalogue of Attributes & Schemes  

[TS11](https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts11-interfaces-and-formats-for-catalogue-of-attributes-and-catalogue-of-schemes.md) defines:

- how attestation types are described,
- how schemas are referenced,
- how wallet/verifier systems can *programmatically* discover these definitions,
- how trust anchors link to the attestation type.

### ETSI TS 119 602 — List of Trusted Entities (LoTE)

[TS 119 602](https://www.etsi.org/deliver/etsi_ts/119600_119699/119602/01.01.01_60/ts_119602v010101p.pdf) defines:

- the JSON structure for publishing trust anchors,
- how issuers, their certificates, and their services are represented,
- how relying parties can determine whether an issuer is trusted for a specific attestation type.

## Repository Structure

```string
catalog-of-attestations/
├── catalog.schema.json                 # JSON Schema for one attestation definition
├── attestations/
│   └── member-ship.json                # Attestation definition (Gym Membership Card)
├── schemas/
│   └── gym-membership.dc+sd-jwt.json   # SD-JWT VC claimset schema for this attestation
├── trust-lists/
│   └── gym-members.json                # ETSI LoTE trust list with X.509 + JWK
└── rulebooks/
    └── gym-membership-card/
        └── 1.0.0.md                    # Human-readable Attestation Rulebook (TS11 Section 4.2)
```

The pieces are intentionally modular — each file has a clear single responsibility.

## Use Cases

This repository can serve multiple actors:

### Credential Issuers

Define and publish attestation types they support, including schemas, formats, and trust declarations.

### Wallet Providers

Discover attestation types and validate their schemas dynamically.

### Relying Parties

Check which issuers are trustworthy for a given attestation type.

### Regulators / Ecosystem Operators

Publish catalogs of standardized attestation types for domains (education, healthcare, finance…).

## Component Details

## 1. `catalog.schema.json` — SchemaMeta Definition (TS11)

This is the **meta-definition** for a single attestation type, aligned with the `SchemaMeta` data model from [TS11 Section 4.3.1](https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts11-interfaces-and-formats-for-catalogue-of-attributes-and-catalogue-of-schemes.md#431-schemameta-main-class).

It defines:

- `id` — unique identifier (UUID), server-assigned when registered in the official catalogue
- `version` — SemVer version string
- `rulebookURI` — URI to the human-readable Attestation Rulebook
- `supportedFormats[]` — credential formats (e.g., `dc+sd-jwt`, `mso_mdoc`)
- `schemaURIs[]` — format-specific schema URIs
- `trustedAuthorities[]` — trust framework references (LoTE, AKI, OpenID Federation)
- `attestationLoS` — level of security (ISO 18045)
- `bindingType` — cryptographic binding type (claim, key, biometric, none)

It is the schema that all entries in `attestations/` must conform to.

Canonical `$id`:

```string
https://raw.githubusercontent.com/cre8/catalog-of-attestations/main/catalog.schema.json
```

---

## 2. `attestations/member-ship.json` — Gym Membership Card

A concrete attestation definition that conforms to `catalog.schema.json`.

It specifies:

- which **credential formats** are supported (`dc+sd-jwt`)
- where to find its **schema**, e.g.  
  `schemas/gym-membership.dc+sd-jwt.json`
- which **trust list** provides the issuers  
  `trust-lists/gmy-members.json`
- which **rulebook** describes the semantics & policies  
  `rulebooks/gym-membership-card/1.0.0.md`

---

## 3. `schemas/gym-membership.dc+sd-jwt.json` — Claimset Schema

A JSON Schema that describes the **logical claims** inside the SD-JWT VC.

This allows:

- wallet credential issuance flows to validate user-provided input,
- verifiers to validate disclosed claims,
- ecosystems to standardize claim structures.

Canonical `$id`:

```string
https://raw.githubusercontent.com/cre8/catalog-of-attestations/main/schemas/gym-membership.dc+sd-jwt.json
```

---

## 4. `trust-lists/gym-members.json` — ETSI LoTE Trust List

This is a minimal example of an ETSI TS 119 602 **List of Trusted Entities**.

It contains:

- scheme metadata (`ListAndSchemeInformation`)
- a list of **TrustedEntities[]**
- each with one or more **TrustedEntityServices[]**
- each service declares a **ServiceDigitalIdentity** (X.509 certificate + JWK)
- each service is linked to a **ServiceDefinitionURI** — the attestation type

This file tells verifiers:

> *Which issuers are authorised to issue this attestation type?  
> With which keys?  
> And since when?*

Wallets **must not rely** on the wallet app to filter untrusted credentials — verifiers must check trust themselves.

---

## How Everything Fits Together (High-Level Flow)

This section describes the conceptual pipeline from *definition → wallet → relying party*.

### 1. **Discover the attestation type**

A wallet or verifier loads:

```string
attestations/member-ship.json
```

This file tells them:

- what the attestation *is*  
- which formats exist  
- where the schemas live  
- where the trust lists live  
- where the rulebook is

### 2. **Load the schema**

Using `schemaURIs[]`, the verifier loads the JSON Schema for the specific format:

```string
schemas/gym-membership.dc+sd-jwt.json
```

This defines all valid claims for this attestation type.

### 3. **Load the trust list**

From `trustedAuthorities[]`, the verifier loads the LoTE:

```string
trust-lists/gym-members.json
```

This file tells:

- which issuers are allowed,
- which keys they use,
- which service corresponds to which attestation type.

### 4. **Use DCQL to request the credential**

The relying party constructs a DCQL query based on:

- **VCT** → defined in the attestation schema
- **claims query** → based on the JSON Schema
- **trusted issuers** → based on the LoTE

### 5. **Receive and verify the credential**

When a wallet presents an SD-JWT VC:

- validate signature(s) using keys from the LoTE  
- confirm the issuer is listed or chains to a listed entity  
- validate disclosed claims against the claimset schema  
- enforce application-specific rules based on the rulebook

---

## Lifecycle

This describes the full lifecycle of attestation type creation and consumption.

### 1. Creating a New Attestation Type

Ecosystem owners or regulators define and publish a new attestation type:

1. **Define the schema(s)** in `schemas/`  
   One for each supported credential format.

2. **Publish the trust list** in `trust-lists/`  
   Listing all trusted issuers and their identities.

3. **Write the rulebook** (optional but recommended) in `rulebooks/`  
   Describing semantics, issuance policy, revocation rules, LoS, etc.

4. **Create the attestation definition** in `attestations/`  
   Linking schemas, trust lists, and rulebook into one canonical entry.

The result is a fully interoperable attestation type.

---

### 2. Consuming an Attestation Type (Relying Parties, Wallets)

To use the attestation type:

1. Load the attestation file from `attestations/`
2. Load referenced schemas from `schemas/`
3. Load the trust list from `trust-lists/`
4. Build a DCQL query using:
   - VCT = `$id` of the schema
   - Required claims from the schema
   - Trusted issuers from the LoTE
5. Validate SD-JWT signatures using keys from the trust list
6. Enforce business rules from the rulebook

Important:

> **Wallets do not filter untrusted issuers.  
It is always the verifier’s responsibility to enforce trust.**
