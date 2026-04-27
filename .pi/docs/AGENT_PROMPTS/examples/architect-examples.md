# Example Prompt Files for Architect Agent

## Examples directory

This directory contains example architectural prompts and scenarios.

```
examples/
├── architect-examples/
│   ├── system-design-1.md
│   ├── scalability-2.md
│   └── migration-3.md
```

---

## Example 1: System Design

### file: examples/architect-examples/system-design-1.md

This example shows designing a complete system from requirements.

```markdown
# System Design Example

## Prompt

Design a recommendation system for {platform}.

### Requirements

- Scale to {millions} of users
- Real-time recommendations
- Train ML models
- Deploy to production
- Handle data pipeline

### Constraints

- Budget for infrastructure
- Compliance requirements
- Security best practices
- Availability SLAs

### Deliverables

- System architecture diagram
- Component descriptions
- Tech stack justification
- Deployment strategy
- Monitoring plan

---

## Expected Deliverables

1. **Architecture Document**
   - High-level diagram
   - Component descriptions
   - Data flow
   - Security model

2. **Tech Stack**
   - Language selection
   - Database choices
   - Infrastructure options
   - ML framework

3. **Deployment**
   - CI/CD pipeline
   - Rollback strategy
   - Blue-green deployment

4. **Monitoring**
   - Metrics to track
   - Alerting thresholds
   - Performance targets

---

## Design Patterns to Consider

- **Microservices** for scalability
- **CQRS** for read/write separation
- **Event sourcing** for audit trails
- **Cache layers** for performance
- **ML pipelines** for model deployment

---

## Example Design Output

```
# System Architecture

## Overview
{Brief description}

## Components
1. **Frontend**
   - React application
   - API client

2. **Backend**
   - Service layer
   - Database layer
   - ML service

3. **Data Pipeline**
   - ETL jobs
   - Feature store
   - Model registry

## Deployment
- Kubernetes cluster
- CI/CD with GitHub Actions
- Monitoring with Prometheus
```

---

## Tips for System Design Prompts

1. **Be specific** about requirements
2. **Include constraints** clearly
3. **Ask for diagrams** (ASCII or mermaid)
4. **Specify deliverables**
5. **Provide context** about business
6. **Iterate** on designs

---

## Common Questions to Ask

- What are the scalability requirements?
- What are the consistency requirements?
- What are the performance targets?
- What are the security requirements?
- What are the budget constraints?
- What are the compliance requirements?
```

---

## Example 2: Scalability Analysis

### file: examples/architect-examples/scalability-2.md

This example shows analyzing scalability requirements.

```markdown
# Scalability Analysis Example

## Prompt

Analyze the scalability of this {system_name} system.

### Current Limitations

- {limitation1}
- {limitation2}
- {limitation3}

### Requirements

- Scale to {user_count} users
- Handle {request_rate} requests/second
- Maintain {latency}ms latency
- Support 99.9% availability

### Deliverables

- Current bottlenecks
- Scaling strategy
- Cost tradeoffs
- Implementation plan

---

## Analysis Framework

1. **Identify Bottlenecks**
   - Database queries
   - Network I/O
   - CPU usage
   - Memory pressure

2. **Determine Scaling Strategy**
   - Horizontal scaling
   - Vertical scaling
   - Database sharding
   - Caching layer

3. **Calculate Costs**
   - Infrastructure costs
   - Database costs
   - Storage costs
   - Compute costs

4. **Create Plan**
   - Priority improvements
   - Quick wins
   - Long-term investments

---

## Example Scoring Matrix

| Aspect | Score (1-5) | Notes |
|--------|-------------|-------|
| Database | 3 | Consider sharding |
| Cache | 2 | Add Redis layer |
| Compute | 4 | Scale horizontally |
| Network | 3 | Optimize queries |

---

## Recommendations

1. **Immediate**: Add caching layer
2. **Short-term**: Database sharding
3. **Long-term**: Multi-region deployment

---

## Common Scenarios

### Database Scaling

- **Option 1**: Vertical scaling
  - Pros: Easy
  - Cons: Limited, expensive

- **Option 2**: Sharding
  - Pros: Scalable
  - Cons: Complex

- **Option 3**: Read replicas
  - Pros: Cheap, simple
  - Cons: Data consistency

### Caching Strategy

- **Option 1**: Application-level
- **Option 2**: Redis cluster
- **Option 3**: CDN + edge cache
```

---

## Example 3: Technology Migration

### file: examples/architect-examples/migration-3.md

This example shows planning a technology migration.

```markdown
# Migration Planning Example

## Prompt

Plan migration from {old_stack} to {new_stack}.

### Current Stack

- Language: {old_language}
- Framework: {old_framework}
- Database: {old_database}
- Infrastructure: {old_infrastructure}

### Target Stack

- Language: {new_language}
- Framework: {new_framework}
- Database: {new_database}
- Infrastructure: {new_infrastructure}

### Risks

- {risk1}
- {risk2}
- {risk3}

### Deliverables

- Migration plan
- Risk assessment
- Rollback strategy
- Team training plan

---

## Migration Strategy Options

1. **Lift-and-Shift**
   - Move infrastructure as-is
   - Pros: Low risk, quick
   - Cons: Doesn't gain benefits

2. **Strangler Fig**
   - Gradual replacement
   - Pros: Low risk, continuous
   - Cons: Complex, long-term

3. **Big Bang**
   - Complete replacement
   - Pros: Quick, complete
   - Cons: High risk

4. **Hybrid**
   - Mix of approaches
   - Pros: Balanced
   - Cons: Complex
```

---

## Example 4: Security Architecture

### file: examples/architect-examples/security-4.md

This example shows designing a security architecture.

```markdown
# Security Architecture Example

## Prompt

Design a security architecture for {project}.

### Requirements

- Meet {compliance_requirement}
- Protect {sensitive_data_type}
- Prevent {threat_type}
- Monitor for {security_incidents}

### Deliverables

- Security model
- Threat model
- Compliance mapping
- Monitoring design

---

## Security Controls

1. **Access Control**
   - Role-based access
   - Least privilege
   - Audit logging
   - SSO integration

2. **Data Protection**
   - Encryption at rest
   - Encryption in transit
   - Key management
   - Data masking

3. **Threat Prevention**
   - Input validation
   - Output encoding
   - Rate limiting
   - WAF rules

4. **Monitoring**
   - Security events
   - Anomaly detection
   - Alerting
   - Incident response
```

---

## Best Practices for Architectural Prompts

1. **Be clear** about requirements
2. **Specify constraints** upfront
3. **Request specific deliverables**
4. **Ask for risk assessment**
5. **Include performance targets**
6. **Mention compliance needs**
7. **Be realistic** about timelines
8. **Iterate** on designs

---

## Checklist for Architectural Prompts

- [ ] Requirements clearly stated
- [ ] Constraints listed
- [ ] Deliverables specified
- [ ] Risk assessment requested
- [ ] Performance targets mentioned
- [ ] Security requirements included
- [ ] Compliance requirements listed
- [ ] Realistic for automated assistance
