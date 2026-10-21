import type { UploadedDocument } from '../types/index.ts';

/**
 * Sample preloaded academic documents for SGU Semester III curriculum
 */
export const INITIAL_PRELOADED_DOCUMENTS: UploadedDocument[] = [
  {
    id: 'doc_dbms_handout',
    name: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
    size: 245 * 1024,
    type: 'pdf',
    uploadedAt: 'Today at 01:15 PM',
    wordCount: 1420,
    status: 'ready',
    subjectId: 'cs201',
    text: `SANJAY GHODAWAT UNIVERSITY - DEPARTMENT OF ARTIFICIAL INTELLIGENCE
COURSE: CS201 DATABASE MANAGEMENT SYSTEMS (SEMESTER III)
UNIT 3: RELATIONAL DATABASE DESIGN & NORMALIZATION THEORY

Section 1: The Problem of Redundancy
Relational schema anomalies arise when multiple real-world facts are grouped into a single table. The three core anomalies are:
1. Insertion Anomaly: Inability to record information about an entity without recording unrelated information about another entity.
2. Deletion Anomaly: Unintended loss of crucial information when a related record is removed.
3. Update Anomaly: Necessity of modifying multiple rows when a single fact changes, risking database inconsistency.

Section 2: First Normal Form (1NF) & Second Normal Form (2NF)
A relation R is in 1NF if and only if all domain values are atomic and no repeating groups exist.
A relation R is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the primary key (no partial functional dependency). If a candidate key is composite (e.g. {StudentID, CourseID}), non-key attributes cannot depend on only StudentID.

Section 3: Third Normal Form (3NF) vs BCNF
A relation R is in 3NF if whenever X -> A holds in R, either:
- X is a superkey of R, or
- A is a prime attribute (member of some candidate key).
This condition specifically eliminates Transitive Dependencies (X -> Y and Y -> A where A is non-prime).
Boyce-Codd Normal Form (BCNF) is strictly stronger: for every non-trivial FD X -> A, X MUST be a superkey. Every BCNF schema is in 3NF, but not every 3NF schema is in BCNF.

Section 4: Lossless-Join Decomposition & Dependency Preservation
Any schema decomposition must guarantee:
1. Lossless Join: Natural join of decomposed tables must recreate the original relation without spurious tuples. R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2.
2. Dependency Preservation: All functional dependencies in F can be enforced without computing joins across decomposed tables.`,
    chunks: [
      {
        id: 'chk_dbms_1',
        documentId: 'doc_dbms_handout',
        documentName: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
        chunkIndex: 0,
        pageOrSection: 'Page 1 (Section 1: Redundancy & Anomalies)',
        content: `Relational schema anomalies arise when multiple real-world facts are grouped into a single table. The three core anomalies are: 1. Insertion Anomaly: Inability to record information about an entity without recording unrelated information about another entity. 2. Deletion Anomaly: Unintended loss of crucial information when a related record is removed. 3. Update Anomaly: Necessity of modifying multiple rows when a single fact changes, risking database inconsistency.`
      },
      {
        id: 'chk_dbms_2',
        documentId: 'doc_dbms_handout',
        documentName: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
        chunkIndex: 1,
        pageOrSection: 'Page 1 (Section 2: 1NF & 2NF Rules)',
        content: `A relation R is in 1NF if and only if all domain values are atomic and no repeating groups exist. A relation R is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the primary key (no partial functional dependency). If a candidate key is composite (e.g. {StudentID, CourseID}), non-key attributes cannot depend on only StudentID.`
      },
      {
        id: 'chk_dbms_3',
        documentId: 'doc_dbms_handout',
        documentName: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
        chunkIndex: 2,
        pageOrSection: 'Page 2 (Section 3: 3NF vs BCNF Comparison)',
        content: `A relation R is in 3NF if whenever X -> A holds in R, either X is a superkey of R, or A is a prime attribute. This condition specifically eliminates Transitive Dependencies (X -> Y and Y -> A). BCNF is strictly stronger: for every FD X -> A, X MUST be a superkey. Every BCNF schema is in 3NF, but not every 3NF schema is in BCNF.`
      },
      {
        id: 'chk_dbms_4',
        documentId: 'doc_dbms_handout',
        documentName: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
        chunkIndex: 3,
        pageOrSection: 'Page 2 (Section 4: Lossless Join & Preservation)',
        content: `Any schema decomposition must guarantee: 1. Lossless Join: Natural join of decomposed tables must recreate the original relation without spurious tuples (R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2). 2. Dependency Preservation: All functional dependencies in F can be enforced without computing joins across decomposed tables.`
      }
    ]
  },
  {
    id: 'doc_ai_foundations',
    name: 'SGU_AI_Foundations_Unit2_Search_Algorithms.md',
    size: 112 * 1024,
    type: 'md',
    uploadedAt: 'Yesterday at 04:30 PM',
    wordCount: 960,
    status: 'ready',
    subjectId: 'ai202',
    text: `# Sanjay Ghodawat University - Department of AI
## Course: AI202 Artificial Intelligence Foundations
### Unit 2: Informed Search & Heuristics

#### 1. A* Search Algorithm
A* evaluates nodes by combining g(n) (cost to reach the node from start) and h(n) (estimated cost from node to goal):
f(n) = g(n) + h(n)

#### 2. Admissibility and Consistency
- An admissible heuristic NEVER overestimates the true cost to reach the goal: h(n) <= h*(n).
- Tree-Search A* is optimal if h(n) is consistent (monotonic): h(n) <= c(n, a, n') + h(n'). Every consistent heuristic is admissible.`,
    chunks: [
      {
        id: 'chk_ai_1',
        documentId: 'doc_ai_foundations',
        documentName: 'SGU_AI_Foundations_Unit2_Search_Algorithms.md',
        chunkIndex: 0,
        pageOrSection: 'Unit 2: Informed Search & A*',
        content: `A* evaluates nodes by combining g(n) (cost to reach the node from start) and h(n) (estimated cost from node to goal): f(n) = g(n) + h(n). Admissible heuristic NEVER overestimates: h(n) <= h*(n). Graph-search A* is optimal if h(n) is consistent: h(n) <= c(n, a, n') + h(n').`
      }
    ]
  }
];
