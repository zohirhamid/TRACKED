# Backend Architecture Diagrams

## Main Use Case Sequence Diagram
Primary flow: user requests insight generation (`POST /api/v1/insights/generate/`).

```mermaid
sequenceDiagram
    autonumber
    actor U as Authenticated User
    participant API as GenerateInsightView (DRF)
    participant DB as Django ORM / DB
    participant SVC as insights.services.generate_insight_content
    participant AI as OpenAI API

    U->>API: POST /api/v1/insights/generate/
    API->>DB: Query active Tracker(user, is_active=True)
    API->>DB: Query DailySnapshot for last 30 days
    loop for each snapshot day
        API->>DB: Query Entry(day, trackers)
    end
    API->>API: Build tracking_data map

    alt no tracking_data
        API-->>U: 400 No tracking data found
    else data exists
        API->>DB: Query latest Insight(owner=user)
        alt cooldown not elapsed
            API-->>U: 429 Wait before generating
        else cooldown ok
            API->>SVC: generate_insight_content(data, period, trackers)
            SVC->>AI: chat.completions.create(...)
            AI-->>SVC: JSON insight content
            SVC-->>API: Parsed content (or fallback)
            API->>DB: Create Insight(owner, period_start, period_end, content)
            API-->>U: 201 Insight payload
        end
    end
```

## Backend Component Diagram
Backend-only structural view of major modules.

```mermaid
graph TD
    CFG[config.urls] --> TR_URLS[apps.tracker.urls]
    CFG --> IN_URLS[apps.insights.urls]

    TR_URLS --> TR_VIEWS[apps.tracker.views]
    TR_VIEWS --> TR_SERV[apps.tracker.services]
    TR_VIEWS --> TR_PERM[apps.tracker.permissions]
    TR_VIEWS --> TR_SER[apps.tracker.serializers]
    TR_SERV --> TR_MODELS[apps.tracker.models]
    TR_SER --> TR_MODELS
    TR_PERM --> TR_MODELS
    TR_SIG[apps.tracker.signals] --> TR_MODELS

    IN_URLS --> IN_VIEWS[apps.insights.views]
    IN_VIEWS --> IN_SER[apps.insights.serializers]
    IN_VIEWS --> IN_MODELS[apps.insights.models]
    IN_VIEWS --> IN_SERV[apps.insights.services]
    IN_VIEWS --> TR_MODELS
    IN_SER --> IN_MODELS
    IN_SERV --> AI_EXT[(OpenAI API)]

    TR_MODELS --> DB[(Database)]
    IN_MODELS --> DB
```

