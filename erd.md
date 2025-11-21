```mermaid
erDiagram

        Stage {
            Prospecting Prospecting
Qualification Qualification
ProposalPriceQuote Proposal/Price Quote
NegotiationReview Negotiation/Review
ClosedWon Closed Won
ClosedLost Closed Lost
        }
    


        AccountType {
            Enterprise Enterprise
MidMarket Mid-Market
SMB SMB
        }
    


        TaskPriority {
            HIGH HIGH
MEDIUM MEDIUM
LOW LOW
        }
    


        TaskStatus {
            OPEN OPEN
OVERDUE OVERDUE
COMPLETED COMPLETED
        }
    


        ActivityType {
            EMAIL EMAIL
CALL CALL
TASK TASK
NOTE NOTE
MEETING MEETING
        }
    


        InvoiceStatus {
            PAID PAID
SENT SENT
OVERDUE OVERDUE
DRAFT DRAFT
        }
    


        LeadStatus {
            NEW NEW
WORKING WORKING
NURTURING NURTURING
QUALIFIED QUALIFIED
DISQUALIFIED DISQUALIFIED
        }
    


        QuoteStatus {
            DRAFT DRAFT
SENT SENT
ACCEPTED ACCEPTED
DECLINED DECLINED
        }
    


        ContractStatus {
            DRAFT DRAFT
ACTIVE ACTIVE
EXPIRED EXPIRED
CANCELLED CANCELLED
        }
    


        WorkflowTriggerType {
            OPPORTUNITY_STAGE_CHANGED OPPORTUNITY_STAGE_CHANGED
TASK_OVERDUE TASK_OVERDUE
INACTIVITY INACTIVITY
        }
    


        WorkflowActionType {
            CREATE_TASK CREATE_TASK
SEND_EMAIL SEND_EMAIL
CREATE_INVOICE CREATE_INVOICE
INVOKE_AI INVOKE_AI
        }
    


        AIInsightType {
            SUMMARY SUMMARY
NEXT_STEP NEXT_STEP
RISK RISK
EMAIL_DRAFT EMAIL_DRAFT
        }
    


        NotificationType {
            TASK TASK
OPPORTUNITY OPPORTUNITY
INVOICE INVOICE
WORKFLOW WORKFLOW
        }
    


        NotificationStatus {
            UNREAD UNREAD
READ READ
        }
    


        EmbeddingStatus {
            PENDING PENDING
PROCESSING PROCESSING
COMPLETED COMPLETED
FAILED FAILED
        }
    
  "Account" {
    Int id "🗝️"
    String name 
    String industry "❓"
    AccountType type 
    Int revenue "❓"
    Int employees "❓"
    String owner "❓"
    String phone "❓"
    String website "❓"
    String location "❓"
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "Contact" {
    Int id "🗝️"
    String name 
    String title "❓"
    String email 
    String phone "❓"
    String owner "❓"
    DateTime lastContact "❓"
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "Opportunity" {
    Int id "🗝️"
    String name 
    Int amount 
    DateTime closeDate 
    Int probability 
    String owner 
    Stage stage 
    String email "❓"
    String phone "❓"
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "Activity" {
    Int id "🗝️"
    ActivityType type 
    String subject 
    String description "❓"
    String performedBy 
    DateTime performedAt 
    DateTime updatedAt 
    }
  

  "Document" {
    Int id "🗝️"
    String name 
    String type 
    String size 
    String uploadedBy 
    DateTime uploadedAt 
    EmbeddingStatus embeddingStatus 
    Int chunkCount 
    DateTime embeddedAt "❓"
    }
  

  "DocumentChunk" {
    Int id "🗝️"
    String content 
    Json metadata "❓"
    Int tokens 
    DateTime createdAt 
    }
  

  "Task" {
    Int id "🗝️"
    String title 
    DateTime dueDate 
    TaskPriority priority 
    TaskStatus status 
    String assignedTo 
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "Invoice" {
    String id "🗝️"
    Int amount 
    InvoiceStatus status 
    DateTime issueDate 
    DateTime dueDate 
    DateTime paidDate "❓"
    String notes "❓"
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "InvoiceItem" {
    Int id "🗝️"
    String description 
    Int quantity 
    Int rate 
    }
  

  "Lead" {
    Int id "🗝️"
    String name 
    String company "❓"
    String email "❓"
    String phone "❓"
    String source "❓"
    LeadStatus status 
    String owner "❓"
    Int score "❓"
    String notes "❓"
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "Product" {
    Int id "🗝️"
    String name 
    String sku "❓"
    String description "❓"
    Int unitPrice 
    String currency 
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "Quote" {
    Int id "🗝️"
    String number 
    QuoteStatus status 
    Int total 
    String currency 
    DateTime issuedAt 
    DateTime expiresAt "❓"
    String notes "❓"
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "QuoteLine" {
    Int id "🗝️"
    String description 
    Int quantity 
    Int unitPrice 
    Int discount 
    }
  

  "Contract" {
    Int id "🗝️"
    String contractNumber 
    ContractStatus status 
    DateTime startDate 
    DateTime endDate "❓"
    Int value 
    String terms "❓"
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "WorkflowRule" {
    Int id "🗝️"
    String name 
    String description "❓"
    WorkflowTriggerType triggerType 
    Json triggerConfig "❓"
    Json conditionConfig "❓"
    Boolean isActive 
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "WorkflowAction" {
    Int id "🗝️"
    WorkflowActionType type 
    Json actionConfig "❓"
    DateTime createdAt 
    }
  

  "AIInsight" {
    Int id "🗝️"
    AIInsightType type 
    String summary 
    Int confidence "❓"
    Json metadata "❓"
    DateTime createdAt 
    }
  

  "Notification" {
    Int id "🗝️"
    NotificationType type 
    NotificationStatus status 
    String title 
    String body 
    String link "❓"
    String recipient 
    DateTime createdAt 
    DateTime readAt "❓"
    }
  

  "Team" {
    Int id "🗝️"
    String name 
    String description "❓"
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "UserTeam" {
    Int id "🗝️"
    String userEmail 
    String role "❓"
    }
  
    "Account" o|--|| "AccountType" : "enum:type"
    "Account" o{--}o "Contact" : ""
    "Account" o{--}o "Opportunity" : ""
    "Account" o{--}o "Invoice" : ""
    "Account" o{--}o "Task" : ""
    "Account" o{--}o "Lead" : ""
    "Account" o{--}o "Quote" : ""
    "Account" o{--}o "Contract" : ""
    "Account" o{--}o "Notification" : ""
    "Account" o{--}o "DocumentChunk" : ""
    "Contact" o|--|| "Account" : "account"
    "Contact" o{--}o "Opportunity" : ""
    "Opportunity" o|--|| "Stage" : "enum:stage"
    "Opportunity" o|--|| "Account" : "account"
    "Opportunity" o|--|o "Contact" : "contact"
    "Opportunity" o{--}o "Activity" : ""
    "Opportunity" o{--}o "Task" : ""
    "Opportunity" o{--}o "Document" : ""
    "Opportunity" o{--}o "Quote" : ""
    "Opportunity" o{--}o "Contract" : ""
    "Opportunity" o{--}o "AIInsight" : ""
    "Opportunity" o{--}o "DocumentChunk" : ""
    "Opportunity" o|--|o "Lead" : "lead"
    "Activity" o|--|| "ActivityType" : "enum:type"
    "Activity" o|--|o "Opportunity" : "opportunity"
    "Document" o|--|| "EmbeddingStatus" : "enum:embeddingStatus"
    "Document" o|--|o "Opportunity" : "opportunity"
    "Document" o{--}o "DocumentChunk" : ""
    "DocumentChunk" o|--|o "Document" : "document"
    "DocumentChunk" o|--|o "Account" : "account"
    "DocumentChunk" o|--|o "Opportunity" : "opportunity"
    "Task" o|--|| "TaskPriority" : "enum:priority"
    "Task" o|--|| "TaskStatus" : "enum:status"
    "Task" o|--|o "Account" : "account"
    "Task" o|--|o "Opportunity" : "opportunity"
    "Task" o|--|o "WorkflowRule" : "workflowRule"
    "Task" o{--}o "AIInsight" : ""
    "Invoice" o|--|| "InvoiceStatus" : "enum:status"
    "Invoice" o|--|| "Account" : "account"
    "Invoice" o{--}o "InvoiceItem" : ""
    "InvoiceItem" o|--|| "Invoice" : "invoice"
    "Lead" o|--|| "LeadStatus" : "enum:status"
    "Lead" o|--|o "Account" : "account"
    "Product" o{--}o "QuoteLine" : ""
    "Quote" o|--|| "QuoteStatus" : "enum:status"
    "Quote" o|--|| "Account" : "account"
    "Quote" o|--|o "Opportunity" : "opportunity"
    "Quote" o{--}o "QuoteLine" : ""
    "QuoteLine" o|--|| "Quote" : "quote"
    "QuoteLine" o|--|o "Product" : "product"
    "Contract" o|--|| "ContractStatus" : "enum:status"
    "Contract" o|--|| "Account" : "account"
    "Contract" o|--|o "Opportunity" : "opportunity"
    "WorkflowRule" o|--|| "WorkflowTriggerType" : "enum:triggerType"
    "WorkflowRule" o{--}o "WorkflowAction" : ""
    "WorkflowAction" o|--|| "WorkflowActionType" : "enum:type"
    "WorkflowAction" o|--|| "WorkflowRule" : "rule"
    "AIInsight" o|--|| "AIInsightType" : "enum:type"
    "AIInsight" o|--|o "Opportunity" : "opportunity"
    "AIInsight" o|--|o "Task" : "task"
    "Notification" o|--|| "NotificationType" : "enum:type"
    "Notification" o|--|| "NotificationStatus" : "enum:status"
    "Notification" o|--|o "Account" : "account"
    "Team" o{--}o "UserTeam" : ""
    "UserTeam" o|--|| "Team" : "team"
```
