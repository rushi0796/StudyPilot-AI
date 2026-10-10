import { Subject, QuestionItem, QuizSession, RevisionTask, TeamMember } from '../types';

export const UNIVERSITY_INFO = {
  name: "Sanjay Ghodawat University",
  shortName: "SGU",
  campus: "Kolhapur, Maharashtra",
  program: "B.Tech in Artificial Intelligence",
  department: "Department of Artificial Intelligence",
  academicYear: "2nd Year (Sophomore)",
  semester: "Semester III",
  curriculumVersion: "CBCS 2024-2025 (Demo Reference)",
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Aken Rushikesh Gopal",
    role: "Team Leader & Lead System Architect",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    focus: "Full-Stack Architecture, AI Tutor Pipeline, Evaluation Core"
  },
  {
    name: "Shaik Imam Hussain",
    role: "AI & Multilingual Systems Specialist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    focus: "Speech Synthesis Engine, Hindi & Telugu Cross-lingual Mapping"
  },
  {
    name: "Dasari Aswan Kumar",
    role: "Curriculum Engineer & Question Bank Lead",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    focus: "Marks-Wise Rubrics, Syllabus Extraction, Exam Pattern Mapping"
  },
  {
    name: "Lajaree Ashish Deorkar",
    role: "UI/UX Designer & Learning Experience Lead",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    focus: "Design System, Spaced-Repetition Revision Planner, Analytics"
  }
];

export const INITIAL_STUDENT_PROFILE = {
  name: "Aken Rushikesh Gopal",
  university: "Sanjay Ghodawat University",
  course: "B.Tech (Four-Year Degree)",
  branch: "Artificial Intelligence & Machine Learning",
  year: "2nd Year",
  semester: "Semester III",
  preferredLanguage: 'en' as const,
  learningPreferences: {
    simpleExplanations: true,
    stepByStep: true,
    examplesBased: true,
    voiceExplanations: true,
  },
  onboardingCompleted: true,
};

export const SUBJECTS_DATA: Subject[] = [
  {
    id: "cs201",
    code: "CS201",
    name: "Database Management Systems",
    semester: "Semester III",
    color: "#2F6BFF",
    iconName: "Database",
    totalQuestionsCount: 28,
    recentlyStudiedTopic: "Relational Database Normalization (3NF vs BCNF)",
    lastStudiedDate: "Today at 02:30 PM",
    units: [
      {
        id: "u1",
        unitNumber: 1,
        title: "Introduction to Database Systems & ER Modeling",
        description: "Foundations of DBMS, ANSI/SPARC 3-schema architecture, data independence, Entity-Relationship (ER) model, extended ER features.",
        weightage: "18% Exam Weightage",
        topics: [
          {
            id: "t1_1",
            unitId: "u1",
            title: "Database System Concepts & Architecture",
            description: "Data independence (physical and logical), 3-tier ANSI/SPARC architecture, DBMS components.",
            learningObjectives: [
              "Understand physical vs logical data independence",
              "Identify roles of query processor and storage engine"
            ],
            importantConcepts: ["3-Tier Architecture", "Data Abstraction", "Physical vs Logical Independence"],
            status: "completed",
            weightageMarks: 5,
            relatedQuestionIds: ["q_arch_5m", "q_arch_2m"]
          },
          {
            id: "t1_2",
            unitId: "u1",
            title: "Entity-Relationship (ER) Modeling",
            description: "Entities, attributes, relationships, cardinality ratios, participation constraints, and ER-to-relational schema mapping.",
            learningObjectives: [
              "Design ER diagrams for university/banking systems",
              "Convert weak entity sets into relational tables"
            ],
            importantConcepts: ["Cardinality Constraints", "Weak Entity Sets", "Relationship Attributes"],
            status: "completed",
            weightageMarks: 7,
            relatedQuestionIds: ["q_er_7m"]
          },
          {
            id: "t1_3",
            unitId: "u1",
            title: "Enhanced ER (EER) Modeling",
            description: "Specialization, generalization, categories (union types), and attribute inheritance.",
            learningObjectives: [
              "Differentiate disjoint vs overlapping specialization",
              "Apply total vs partial specialization constraints"
            ],
            importantConcepts: ["Generalization vs Specialization", "Disjointness Constraint"],
            status: "in-progress",
            weightageMarks: 4,
            relatedQuestionIds: ["q_eer_4m"]
          }
        ]
      },
      {
        id: "u2",
        unitNumber: 2,
        title: "Relational Model, Algebra & Advanced SQL",
        description: "Relational constraints, integrity rules, formal relational algebra operators, and SQL DDL/DML constructs.",
        weightage: "22% Exam Weightage",
        topics: [
          {
            id: "t2_1",
            unitId: "u2",
            title: "Relational Model & Integrity Constraints",
            description: "Domain constraints, key constraints, entity integrity, and referential integrity with CASCADE/RESTRICT.",
            learningObjectives: [
              "Verify foreign key integrity actions",
              "Identify superkeys, candidate keys, and primary keys"
            ],
            importantConcepts: ["Referential Integrity", "Candidate Keys", "Null Value Semantics"],
            status: "completed",
            weightageMarks: 5,
            relatedQuestionIds: ["q_keys_2m", "q_integ_5m"]
          },
          {
            id: "t2_2",
            unitId: "u2",
            title: "Relational Algebra Operations",
            description: "Fundamental operators (Select, Project, Cartesian Product, Union, Difference) and derived operators (Natural Join, Theta Join, Division).",
            learningObjectives: [
              "Formulate relational algebra queries for complex data retrieval",
              "Prove equivalence of query expressions"
            ],
            importantConcepts: ["Theta vs Natural Join", "Division Operator", "Selection Pushdown"],
            status: "completed",
            weightageMarks: 7,
            relatedQuestionIds: ["q_ra_7m"]
          },
          {
            id: "t2_3",
            unitId: "u2",
            title: "SQL Queries, Views, and Triggers",
            description: "Nested correlated subqueries, aggregate grouping, stored procedures, and declarative assertions.",
            learningObjectives: [
              "Write correlated subqueries using EXISTS and NOT EXISTS",
              "Create updatable relational views"
            ],
            importantConcepts: ["Correlated Subqueries", "HAVING vs WHERE", "Row-level Triggers"],
            status: "in-progress",
            weightageMarks: 5,
            relatedQuestionIds: ["q_sql_5m"]
          }
        ]
      },
      {
        id: "u3",
        unitNumber: 3,
        title: "Relational Design Theory & Normalization",
        description: "Functional dependencies, Armstrong's axioms, normal forms (1NF, 2NF, 3NF, BCNF, 4NF), and lossless join decomposition.",
        weightage: "26% Exam Weightage",
        topics: [
          {
            id: "t3_1",
            unitId: "u3",
            title: "Functional Dependencies & Inference Rules",
            description: "Definition of FDs, closure of attributes (X+), closure of FDs (F+), minimal cover, and Armstrong's axioms.",
            learningObjectives: [
              "Compute attribute closures to find all candidate keys",
              "Derive canonical/minimal covers for a given FD set"
            ],
            importantConcepts: ["Attribute Closure", "Armstrong Axioms", "Minimal Cover"],
            status: "completed",
            weightageMarks: 5,
            relatedQuestionIds: ["q_fd_2m", "q_armstrong_3m"]
          },
          {
            id: "t3_2",
            unitId: "u3",
            title: "1NF, 2NF and 3NF Normalization",
            description: "First Normal Form (atomic values), Second Normal Form (removal of partial dependencies), Third Normal Form (removal of transitive dependencies).",
            learningObjectives: [
              "Diagnose update, insertion, and deletion anomalies",
              "Decompose non-normalized schemas into 3NF systematically"
            ],
            importantConcepts: ["Partial Dependency", "Transitive Dependency", "Prime vs Non-Prime Attributes"],
            status: "in-progress",
            weightageMarks: 7,
            relatedQuestionIds: ["q_norm_5m", "q_prime_2m"]
          },
          {
            id: "t3_3",
            unitId: "u3",
            title: "Boyce-Codd Normal Form (BCNF) & 4NF",
            description: "Strict superkey requirement for every determinant (X->Y implies X is superkey), comparison with 3NF, dependency preservation trade-offs.",
            learningObjectives: [
              "Identify schemas in 3NF that violate BCNF",
              "Assess loss of functional dependency preservation during BCNF decomposition"
            ],
            importantConcepts: ["BCNF Determinant Rule", "Dependency Preservation Trade-off", "Multi-valued Dependency"],
            status: "not-started",
            weightageMarks: 10,
            relatedQuestionIds: ["q_bcnf_5m", "q_decomp_10m"]
          }
        ]
      },
      {
        id: "u4",
        unitNumber: 4,
        title: "Transaction Processing & Concurrency Control",
        description: "ACID properties, serializability, conflict graphs, 2-phase locking (2PL), deadlock handling, and recovery protocols.",
        weightage: "20% Exam Weightage",
        topics: [
          {
            id: "t4_1",
            unitId: "u4",
            title: "Transaction Concepts & ACID Properties",
            description: "Atomicity, Consistency, Isolation, and Durability guarantees. Transaction state diagram.",
            learningObjectives: [
              "Explain how write-ahead logging guarantees Atomicity & Durability",
              "Trace transaction states from Active to Committed/Aborted"
            ],
            importantConcepts: ["ACID Guarantees", "Write-Ahead Log", "Transaction State Machine"],
            status: "completed",
            weightageMarks: 5,
            relatedQuestionIds: ["q_acid_2m", "q_acid_5m"]
          },
          {
            id: "t4_2",
            unitId: "u4",
            title: "Serializability & Conflict Precedence",
            description: "Conflict vs view serializability, precedence graphs, cycle detection for schedule correctness.",
            learningObjectives: [
              "Construct precedence graph and detect cycles using topological sort",
              "Explain anomalous read phenomena (dirty read, unrepeatable read, phantom read)"
            ],
            importantConcepts: ["Conflict Serializability", "Precedence Graph", "Dirty Read Anomaly"],
            status: "in-progress",
            weightageMarks: 7,
            relatedQuestionIds: ["q_serial_4m", "q_anom_7m"]
          },
          {
            id: "t4_3",
            unitId: "u4",
            title: "Concurrency Protocols & 2PL",
            description: "Two-Phase Locking (Growing/Shrinking phases), Strict 2PL, Rigorous 2PL, timestamp-based protocols.",
            learningObjectives: [
              "Differentiate basic 2PL from Strict 2PL regarding cascading rollbacks",
              "Analyze deadlock wait-for graphs"
            ],
            importantConcepts: ["2PL Phases", "Cascading Rollback Prevention", "Wait-Die vs Wound-Wait"],
            status: "not-started",
            weightageMarks: 5,
            relatedQuestionIds: ["q_2pl_4m"]
          }
        ]
      },
      {
        id: "u5",
        unitNumber: 5,
        title: "Indexing, B-Trees & Query Optimization",
        description: "File storage, dense vs sparse indexes, multi-level indexing, B+ Tree search and split algorithms, cost estimation.",
        weightage: "14% Exam Weightage",
        topics: [
          {
            id: "t5_1",
            unitId: "u5",
            title: "File Organization & Primary vs Secondary Indexes",
            description: "Heap files, sorted files, clustered index on ordered keys, secondary index on non-ordering attributes.",
            learningObjectives: [
              "Compare I/O block transfer costs across index structures",
              "Distinguish dense indexes from sparse indexes"
            ],
            importantConcepts: ["Dense vs Sparse Index", "Clustered Index", "Index Search Key"],
            status: "in-progress",
            weightageMarks: 4,
            relatedQuestionIds: ["q_index_4m"]
          },
          {
            id: "t5_2",
            unitId: "u5",
            title: "B-Trees and B+ Trees Architecture",
            description: "Balanced multi-way search trees, node splitting on insertion, leaf-level linked chains in B+ trees.",
            learningObjectives: [
              "Perform node search and insertion trace in B+ Tree of order p",
              "Explain why B+ Trees are preferred for disk block storage over binary trees"
            ],
            importantConcepts: ["B+ Tree Leaf Chain", "Fan-out & Height", "Range Query Efficiency"],
            status: "not-started",
            weightageMarks: 7,
            relatedQuestionIds: ["q_btree_3m", "q_btree_7m"]
          }
        ]
      }
    ]
  },
  {
    id: "ai202",
    code: "AI202",
    name: "Artificial Intelligence Foundations",
    semester: "Semester III",
    color: "#8B5CF6",
    iconName: "BrainCircuit",
    totalQuestionsCount: 24,
    recentlyStudiedTopic: "A* Search & Heuristic Admissibility",
    lastStudiedDate: "Yesterday at 05:10 PM",
    units: [
      {
        id: "ai_u1",
        unitNumber: 1,
        title: "Intelligent Agents & Problem Formulation",
        description: "PEAS descriptions, agent environments, state space graphs, uninformed search algorithms.",
        weightage: "20% Exam Weightage",
        topics: [
          {
            id: "ai_t1_1",
            unitId: "ai_u1",
            title: "Agent Architectures & PEAS Modeling",
            description: "Performance, Environment, Actuators, Sensors formulation for robotic and software agents.",
            learningObjectives: ["Formulate PEAS for autonomous vehicles and medical tutors"],
            importantConcepts: ["PEAS", "Observable vs Partially Observable Environments"],
            status: "completed",
            weightageMarks: 4,
          }
        ]
      },
      {
        id: "ai_u2",
        unitNumber: 2,
        title: "Informed Search & Heuristics",
        description: "Greedy Best-First Search, A* Search algorithm, admissible and consistent heuristics.",
        weightage: "25% Exam Weightage",
        topics: [
          {
            id: "ai_t2_1",
            unitId: "ai_u2",
            title: "A* Search & Admissibility Criteria",
            description: "Evaluation function f(n) = g(n) + h(n), optimality proofs, Euclidean vs Manhattan heuristics.",
            learningObjectives: ["Prove optimality of A* when heuristic h(n) is admissible"],
            importantConcepts: ["Heuristic Admissibility", "f(n)=g(n)+h(n)", "Monotonicity"],
            status: "in-progress",
            weightageMarks: 7,
          }
        ]
      }
    ]
  },
  {
    id: "cs203",
    code: "CS203",
    name: "Data Structures & Algorithms",
    semester: "Semester III",
    color: "#10B981",
    iconName: "Binary",
    totalQuestionsCount: 32,
    recentlyStudiedTopic: "AVL Tree Rotations & Balanced Trees",
    lastStudiedDate: "3 days ago",
    units: [
      {
        id: "dsa_u1",
        unitNumber: 1,
        title: "Linear Data Structures & Analysis",
        description: "Asymptotic notation, amortized complexity, linked lists, stacks, queues, and priority queues.",
        weightage: "20% Exam Weightage",
        topics: [
          {
            id: "dsa_t1",
            unitId: "dsa_u1",
            title: "Asymptotic Complexity & Masters Theorem",
            description: "Big O, Omega, Theta notations and solving divide-and-conquer recurrences.",
            learningObjectives: ["Solve recurrence relations using Master's Theorem"],
            importantConcepts: ["Master Theorem Cases", "Tight Upper Bounds"],
            status: "completed",
            weightageMarks: 5,
          }
        ]
      }
    ]
  },
  {
    id: "ma204",
    code: "MA204",
    name: "Discrete Mathematics & Graph Theory",
    semester: "Semester III",
    color: "#F59E0B",
    iconName: "Network",
    totalQuestionsCount: 18,
    recentlyStudiedTopic: "Graph Isomorphism & Eulerian Paths",
    lastStudiedDate: "Last week",
    units: [
      {
        id: "ma_u1",
        unitNumber: 1,
        title: "Propositional Logic & Proof Methods",
        description: "Truth tables, logical equivalences, predicate calculus, mathematical induction.",
        weightage: "25% Exam Weightage",
        topics: [
          {
            id: "ma_t1",
            unitId: "ma_u1",
            title: "Mathematical Induction & Well-Ordering Principle",
            description: "Weak vs strong induction, recurrence relations.",
            learningObjectives: ["Formulate rigorous mathematical induction proofs"],
            importantConcepts: ["Base Case", "Inductive Step", "Strong Induction"],
            status: "in-progress",
            weightageMarks: 5,
          }
        ]
      }
    ]
  },
  {
    id: "cs205",
    code: "CS205",
    name: "Computer Organization & Architecture",
    semester: "Semester III",
    color: "#EC4899",
    iconName: "Cpu",
    totalQuestionsCount: 20,
    recentlyStudiedTopic: "Instruction Pipelining & Hazards",
    lastStudiedDate: "Oct 04, 2026",
    units: [
      {
        id: "coa_u1",
        unitNumber: 1,
        title: "Instruction Set Architecture & CPU Design",
        description: "MIPS/RISC architecture, addressing modes, ALU design, control unit.",
        weightage: "22% Exam Weightage",
        topics: [
          {
            id: "coa_t1",
            unitId: "coa_u1",
            title: "Instruction Pipelining & Data Hazards",
            description: "5-stage pipeline, RAW/WAR/WAW hazards, branch prediction.",
            learningObjectives: ["Identify pipeline stalls and forwarding techniques"],
            importantConcepts: ["Data Forwarding", "Branch Delay Slot", "Structural Hazards"],
            status: "in-progress",
            weightageMarks: 7,
          }
        ]
      }
    ]
  }
];

export const QUESTION_BANK_DATA: QuestionItem[] = [
  {
    id: "q_norm_5m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 3,
    topic: "1NF, 2NF and 3NF Normalization",
    text: "Explain Database Normalization. Why is 3NF preferred over 2NF? Illustrate with a concrete student or employee course example.",
    marks: 5,
    difficulty: "Medium",
    type: "Theory",
    isBookmarked: true,
    markingCriteria: [
      "1 Mark: Clear definition of Database Normalization and purpose (preventing redundancy & anomalies).",
      "1 Mark: Definition of 2NF (1NF + no partial dependency on composite candidate keys).",
      "1.5 Marks: Definition of 3NF (2NF + no transitive dependency: X->A requires X is superkey or A is prime).",
      "1 Mark: Real-world example schema demonstrating decomposition of 2NF into 3NF.",
      "0.5 Mark: Explanation of anomalies eliminated (insert/update/delete)."
    ],
    modelAnswer: `**Definition:**
Database Normalization is the systematic process of organizing data in a relational database to minimize data redundancy and eliminate undesirable update, insertion, and deletion anomalies.

**Why 3NF is Preferred Over 2NF:**
A relation in 2NF eliminates partial functional dependencies (where a non-prime attribute depends on part of a composite primary key). However, 2NF relations can still suffer from **Transitive Dependencies**—where a non-prime attribute depends on another non-prime attribute (X → Y → Z).

This transitive dependency leads to serious anomalies:
1. **Insertion Anomaly:** You cannot add department head info until a student enrolls.
2. **Deletion Anomaly:** Deleting the last student in a department deletes all department details.
3. **Update Anomaly:** Changing a department location requires updating many redundant rows.

**Concrete Example:**
Consider relation: \`Student_Dept(RollNo, StudentName, DeptCode, DeptName, HODName)\`
- Primary Key: \`RollNo\`
- FDs:
  - \`RollNo -> StudentName, DeptCode\`
  - \`DeptCode -> DeptName, HODName\`

Here, \`RollNo\` is a single-attribute key, so the relation is already in 2NF (no partial dependency exists).
However, \`RollNo -> DeptCode\` and \`DeptCode -> HODName\` creates a **transitive dependency**:
\`RollNo (Primary Key) -> DeptCode (Non-prime) -> HODName (Non-prime)\`.

**Decomposition into 3NF:**
To achieve 3NF, we decompose the schema into two relations:
1. \`Student(RollNo, StudentName, DeptCode)\` [Primary Key: RollNo, Foreign Key: DeptCode]
2. \`Department(DeptCode, DeptName, HODName)\` [Primary Key: DeptCode]

Both resulting tables are in 3NF because every determinant is a superkey, eliminating all transitive anomalies cleanly.`,
    keyPoints: [
      "Purpose: Eliminate insertion, deletion, and update anomalies",
      "2NF definition: Must be in 1NF and have no partial dependencies",
      "3NF condition: In 2NF and no transitive dependency (X->A where X is superkey OR A is prime attribute)",
      "Concrete schema decomposition demonstrated with keys labeled"
    ],
    commonMistakes: [
      "Confusing partial dependency (part of composite key -> non-prime) with transitive dependency (non-prime -> non-prime).",
      "Failing to specify primary and foreign keys in the decomposed tables.",
      "Not explicitly mentioning the three anomalies (Insert, Update, Delete)."
    ]
  },
  {
    id: "q_acid_5m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 4,
    topic: "Transaction Concepts & ACID Properties",
    text: "Explain the ACID properties of database transactions in detail. Provide a real-world fund transfer example for each property.",
    marks: 5,
    difficulty: "Medium",
    type: "Theory",
    isBookmarked: false,
    markingCriteria: [
      "1 Mark: Definition of a Transaction and need for ACID properties.",
      "1 Mark: Atomicity (All-or-Nothing rule) with funds debit/credit example.",
      "1 Mark: Consistency (Preserving database invariants and balance constraints).",
      "1 Mark: Isolation (Concurrent transactions do not interfere with intermediate states).",
      "1 Mark: Durability (Committed changes survive system crashes via WAL/recovery)."
    ],
    modelAnswer: `**Transaction Definition:**
A transaction is a logical unit of database processing that includes one or more database access operations (read, write, update). To ensure data integrity, every transaction must satisfy ACID properties:

1. **Atomicity (All or Nothing):**
   - Either all operations of the transaction execute successfully, or none do.
   - *Example:* In transferring ₹5,000 from Account A to Account B: If the system debits ₹5,000 from A and crashes before crediting B, the entire transaction is rolled back. Account A is restored to its original balance.

2. **Consistency (Integrity Preservation):**
   - Execution of a transaction in isolation must preserve database invariants and integrity constraints.
   - *Example:* The total combined balance of Account A and Account B must be identical before and after the transfer (\`Balance(A) + Balance(B) = Constant\`). Also, account balance cannot drop below the minimum required balance.

3. **Isolation (Non-interference):**
   - Intermediate states of a running transaction must remain invisible to other concurrently executing transactions.
   - *Example:* While the ₹5,000 transfer is executing, an auditor running a total sum query must not see intermediate state where ₹5,000 is deducted from A but not yet added to B.

4. **Durability (Permanence):**
   - Once a transaction commits, its modifications are permanently recorded in non-volatile storage and survive power failures or OS crashes.
   - *Example:* After receiving a 'Transaction Successful' confirmation, even if the university server loses power seconds later, the ₹5,000 remains credited in Account B when the server restarts (guaranteed via Write-Ahead Logging).`,
    keyPoints: [
      "Atomicity: All-or-nothing execution guaranteed by transaction log rollback",
      "Consistency: State transitions preserve all database business rules and constraints",
      "Isolation: Concurrency control protocols (like 2PL) ensure serializable execution",
      "Durability: Write-Ahead Logging (WAL) and checkpoints ensure recovery from crash"
    ],
    commonMistakes: [
      "Confusing Consistency with Isolation.",
      "Claiming Atomicity prevents concurrent access (that is Isolation's job).",
      "Neglecting to mention how Durability survives system failures."
    ]
  },
  {
    id: "q_fd_2m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 3,
    topic: "Functional Dependencies & Inference Rules",
    text: "Define Functional Dependency in DBMS with a formal mathematical expression and a simple example.",
    marks: 2,
    difficulty: "Easy",
    type: "Theory",
    isBookmarked: false,
    markingCriteria: [
      "1 Mark: Formal definition (Given relation R, X -> Y holds if for any two tuples t1, t2 with t1[X] = t2[X], then t1[Y] = t2[Y]).",
      "1 Mark: Clear example demonstrating determinant and dependent attributes."
    ],
    modelAnswer: `**Formal Definition:**
Given a relational schema $R$, a functional dependency $X \\rightarrow Y$ between attribute sets $X$ and $Y$ ($X, Y \\subseteq R$) specifies a constraint that for any valid legal relational state $r(R)$, whenever two tuples $t_1$ and $t_2$ have the same values on attribute set $X$, they must also agree on attribute set $Y$:
$$\\forall t_1, t_2 \\in r(R), \\quad \\text{if } t_1[X] = t_2[X] \\implies t_1[Y] = t_2[Y]$$
Here, $X$ is called the **Determinant** and $Y$ is called the **Dependent**.

**Example:**
In a student relation \`Student(RollNo, Name, Email, Dept)\`:
\`RollNo -> Name, Dept\` holds because every distinct Roll Number uniquely identifies exactly one Student Name and Department.`,
    keyPoints: [
      "Mathematical tuple condition t1[X]=t2[X] implies t1[Y]=t2[Y]",
      "Identification of Determinant (X) and Dependent (Y)",
      "Uniqueness constraint example"
    ],
    commonMistakes: [
      "Describing it colloquially without the formal tuple constraint definition.",
      "Inverting the arrow direction (writing Y -> X)."
    ]
  },
  {
    id: "q_acid_2m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 4,
    topic: "Transaction Concepts & ACID Properties",
    text: "What do the letters in ACID stand for in DBMS transactions? Briefly state the role of each.",
    marks: 2,
    difficulty: "Easy",
    type: "Theory",
    isBookmarked: false,
    markingCriteria: [
      "0.5 Mark: Full acronym expansion (Atomicity, Consistency, Isolation, Durability).",
      "1.5 Marks: Concise single-sentence role description for each component."
    ],
    modelAnswer: `**ACID stands for:**
1. **A - Atomicity:** Guarantees 'all-or-nothing' execution; if any step fails, the entire transaction rolls back.
2. **C - Consistency:** Ensures the database transitions from one valid consistent state satisfying all integrity constraints to another.
3. **I - Isolation:** Prevents concurrently executing transactions from interfering with or observing each other's uncommitted intermediate data.
4. **D - Durability:** Guarantees that once a transaction commits, its updates persist in storage even through hardware or system crashes.`,
    keyPoints: ["All four terms expanded", "Accurate one-line definition for each"],
    commonMistakes: ["Misidentifying 'I' as Integrity or Independence"]
  },
  {
    id: "q_prime_2m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 3,
    topic: "1NF, 2NF and 3NF Normalization",
    text: "Differentiate between a Prime Attribute and a Non-Prime Attribute with an example.",
    marks: 2,
    difficulty: "Easy",
    type: "Theory",
    isBookmarked: true,
    markingCriteria: [
      "1 Mark: Accurate definitions (Prime = member of ANY candidate key; Non-Prime = not part of ANY candidate key).",
      "1 Mark: Example highlighting a relation with composite candidate key."
    ],
    modelAnswer: `**Prime Attribute:**
An attribute that is a member of **at least one candidate key** of the relational schema $R$.

**Non-Prime Attribute:**
An attribute that is **not part of any candidate key** of the relation.

**Example:**
Consider relation \`Course_Enrollment(StudentID, CourseCode, Grade, Semester)\`
- Candidate Key: \`{StudentID, CourseCode}\`
- **Prime Attributes:** \`StudentID\`, \`CourseCode\` (since they form the candidate key).
- **Non-Prime Attributes:** \`Grade\`, \`Semester\` (neither belongs to any candidate key).`,
    keyPoints: ["Candidate key membership distinction", "Clear concrete example"],
    commonMistakes: ["Restricting prime attributes to primary key only, ignoring other candidate keys."]
  },
  {
    id: "q_btree_3m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 5,
    topic: "B-Trees and B+ Trees Architecture",
    text: "Differentiate between a B-Tree and a B+ Tree in database indexing across three key criteria.",
    marks: 3,
    difficulty: "Medium",
    type: "Theory",
    isBookmarked: false,
    markingCriteria: [
      "1 Mark: Data record pointer storage difference (B-Tree internal nodes hold data; B+ Tree stores data only at leaf nodes).",
      "1 Mark: Leaf node linking (B+ Tree leaves are linked via doubly linked list for fast range queries; B-Tree leaves are separate).",
      "1 Mark: Tree height and fan-out comparison."
    ],
    modelAnswer: `| Feature / Criterion | B-Tree | B+ Tree (Preferred for DBMS) |
|---|---|---|
| **Data Pointer Storage** | Key values and actual data record pointers are stored in **both internal nodes and leaf nodes**. | Internal nodes store **only search keys and child pointers**; all actual record pointers are stored strictly in the **leaf nodes**. |
| **Range Queries** | Inefficient for range searches; requires in-order tree traversals moving up and down levels. | Extremely efficient; all leaf nodes are interconnected as a **doubly-linked list**, allowing rapid sequential scanning. |
| **Fan-out & Tree Height** | Smaller fan-out because internal nodes take up space with data pointers; taller tree. | Much higher fan-out per node; shorter tree with fewer disk I/O operations required per search. |`,
    keyPoints: ["Storage location of data pointers", "Leaf node linked list structure", "Range search efficiency"],
    commonMistakes: ["Stating B-trees do not store keys in internal nodes."]
  },
  {
    id: "q_armstrong_3m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 3,
    topic: "Functional Dependencies & Inference Rules",
    text: "State and explain Armstrong's Axioms for functional dependencies with mathematical notation.",
    marks: 3,
    difficulty: "Medium",
    type: "Theory",
    isBookmarked: false,
    markingCriteria: [
      "1 Mark: Reflexivity rule with condition.",
      "1 Mark: Augmentation rule with condition.",
      "1 Mark: Transitivity rule with condition."
    ],
    modelAnswer: `Armstrong's Axioms are a set of sound and complete inference rules used to compute the closure of functional dependencies ($F^+$):

1. **Axiom of Reflexivity:**
   If $Y \\subseteq X$, then $X \\rightarrow Y$.
   *(If an attribute set contains another, it functionally determines that subset. E.g., \`{RollNo, Name} -> RollNo\`)*

2. **Axiom of Augmentation:**
   If $X \\rightarrow Y$, then $XZ \\rightarrow YZ$ for any attribute set $Z$.
   *(Adding the same attributes to both sides preserves the dependency. E.g., \`RollNo -> Name\` implies \`{RollNo, Dept} -> {Name, Dept}\`)*

3. **Axiom of Transitivity:**
   If $X \\rightarrow Y$ and $Y \\rightarrow Z$, then $X \\rightarrow Z$.
   *(Functional dependencies chain transitively. E.g., \`RollNo -> DeptCode\` and \`DeptCode -> HOD\` implies \`RollNo -> HOD\`)*`,
    keyPoints: ["Reflexivity: Y subset of X => X->Y", "Augmentation: X->Y => XZ->YZ", "Transitivity: X->Y and Y->Z => X->Z"],
    commonMistakes: ["Confusing augmentation with union rule.", "Omitting the subset condition in reflexivity."]
  },
  {
    id: "q_serial_4m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 4,
    topic: "Serializability & Conflict Precedence",
    text: "Explain Conflict Serializability. How is a Precedence Graph (Serialization Graph) used to test whether a concurrent schedule is conflict serializable? Explain with a 4-mark format.",
    marks: 4,
    difficulty: "Medium",
    type: "Theory",
    isBookmarked: true,
    markingCriteria: [
      "1 Mark: Definition of Conflicting Operations (two operations on same data item, by different transactions, where at least one is a Write).",
      "1 Mark: Definition of Conflict Serializability (schedule is conflict equivalent to some serial schedule).",
      "1.5 Marks: Precedence graph construction algorithm (Nodes = Transactions, Directed Edges = Conflict order Ti -> Tj).",
      "0.5 Mark: Decision rule (Schedule is conflict serializable IF AND ONLY IF the precedence graph contains NO cycles)."
    ],
    modelAnswer: `**Conflicting Operations:**
Two operations $I_i$ and $I_j$ in a schedule conflict if:
1. They belong to different transactions ($T_i \\neq T_j$).
2. They access the same data item $Q$.
3. At least one of the operations is a **Write** operation ($W_i(Q)$ and $R_j(Q)$, or $R_i(Q)$ and $W_j(Q)$, or $W_i(Q)$ and $W_j(Q)$).

**Conflict Serializability:**
A concurrent schedule $S$ is conflict serializable if it can be transformed into an equivalent serial schedule by swapping non-conflicting adjacent operations.

**Testing with Precedence Graph:**
1. **Vertices ($V$):** Create a node for each active transaction $T_1, T_2, \\dots, T_n$.
2. **Directed Edges ($E$):** Draw a directed edge $T_i \\rightarrow T_j$ if $T_i$ executes a conflicting operation before $T_j$ executes its conflicting operation on the same data item:
   - $T_i$ executes $Read(Q)$ before $T_j$ executes $Write(Q)$.
   - $T_i$ executes $Write(Q)$ before $T_j$ executes $Read(Q)$.
   - $T_i$ executes $Write(Q)$ before $T_j$ executes $Write(Q)$.

**Decision Rule:**
- **Conflict Serializable:** If and only if the precedence graph is **Acyclic** (contains NO directed cycles).
- The equivalent serial execution order is obtained via **Topological Sorting** of the acyclic graph.
- If a cycle exists ($T_1 \\rightarrow T_2 \\rightarrow T_1$), the schedule is **NOT conflict serializable**.`,
    keyPoints: [
      "3 conditions for conflicting operations",
      "Directed edge Ti -> Tj condition",
      "Acyclic graph theorem & topological sort"
    ],
    commonMistakes: [
      "Missing that two read operations on the same data item do NOT conflict.",
      "Forgetting the cycle detection rule."
    ]
  },
  {
    id: "q_bcnf_5m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 3,
    topic: "Boyce-Codd Normal Form (BCNF) & 4NF",
    text: "Define Boyce-Codd Normal Form (BCNF). How does it differ from 3NF? Give a relation that is in 3NF but not in BCNF.",
    marks: 5,
    difficulty: "Hard",
    type: "Theory",
    isBookmarked: true,
    markingCriteria: [
      "1 Mark: Formal definition of BCNF (for every non-trivial FD X->Y, X must be a superkey).",
      "1.5 Marks: Comparison between 3NF and BCNF conditions (explaining the prime attribute relaxation in 3NF).",
      "1.5 Marks: Concrete counter-example schema with overlapping candidate keys.",
      "1 Mark: Explanation of why BCNF decomposition may lose functional dependency preservation."
    ],
    modelAnswer: `**BCNF Definition:**
A relational schema $R$ is in Boyce-Codd Normal Form (BCNF) if for every non-trivial functional dependency $X \\rightarrow Y$ holding on $R$, the determinant $X$ is a **Superkey** of $R$.

**Difference Between 3NF and BCNF:**
In **3NF**, for every non-trivial FD $X \\rightarrow A$:
- Either $X$ is a Superkey, **OR**
- $A$ is a **Prime Attribute** (part of some candidate key).

**BCNF removes the second relaxation completely.** In BCNF, $X$ MUST be a superkey regardless of whether $A$ is a prime attribute. Hence, BCNF is strictly stronger than 3NF ($BCNF \\subset 3NF$).

**Example (In 3NF but NOT in BCNF):**
Consider a university advisory relation:
\`Student_Advisor(StudentID, Subject, Advisor)\`
Constraints:
1. Each student has at most one advisor per subject: \`{StudentID, Subject} -> Advisor\`
2. Each advisor teaches only ONE subject: \`Advisor -> Subject\`

**Analysis:**
- Candidate Keys: \`{StudentID, Subject}\` and \`{StudentID, Advisor}\`
- Prime Attributes: \`StudentID\`, \`Subject\`, \`Advisor\` (all attributes are prime!)
- Check FD \`Advisor -> Subject\`:
  - Is \`Advisor\` a superkey? **NO** (Advisor alone cannot determine StudentID).
  - Is \`Subject\` a prime attribute? **YES** (it belongs to candidate key \`{StudentID, Subject}\`).

Therefore:
- **It IS in 3NF** because the right-hand side \`Subject\` is prime.
- **It is NOT in BCNF** because the determinant \`Advisor\` is NOT a superkey!

**Trade-off:**
Decomposing into BCNF: \`R1(Advisor, Subject)\` and \`R2(StudentID, Advisor)\` eliminates redundancy but **loses dependency preservation** for \`{StudentID, Subject} -> Advisor\`.`,
    keyPoints: [
      "BCNF rule: Every determinant must be a superkey",
      "3NF allows A to be prime attribute; BCNF does not",
      "Student-Subject-Advisor classic counterexample",
      "Tradeoff: BCNF guarantees no redundancy from FDs but may sacrifice dependency preservation"
    ],
    commonMistakes: [
      "Failing to explain why Advisor -> Subject violates BCNF.",
      "Claiming 3NF and BCNF are identical."
    ]
  },
  {
    id: "q_anom_7m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 4,
    topic: "Serializability & Conflict Precedence",
    text: "Explain the three classic Concurrency Anomalies (Lost Update, Dirty Read / Temporary Update, and Unrepeatable Read) with timeline schedules and solutions. (7 Marks)",
    marks: 7,
    difficulty: "Hard",
    type: "Theory",
    isBookmarked: false,
    markingCriteria: [
      "2 Marks: Lost Update problem with step-by-step transaction timeline and financial impact.",
      "2 Marks: Dirty Read (Temporary Update) anomaly with rollback scenario.",
      "2 Marks: Unrepeatable Read (Inconsistent Analysis) anomaly with re-read difference.",
      "1 Mark: Concurrency control mitigation (Locking protocols / Isolation levels)."
    ],
    modelAnswer: `### 1. The Lost Update Anomaly (2 Marks)
**Occurs when:** Two transactions access the same item concurrently and their operations interleave such that the write of the second transaction overwrites the write of the first transaction without including its changes.
- **Timeline Example:**
  - $t_1: T_1$ reads balance $X = 1000$
  - $t_2: T_2$ reads balance $X = 1000$
  - $t_3: T_1$ adds $100$ and writes $X = 1100$
  - $t_4: T_2$ deducts $200$ and writes $X = 800$
- **Result:** $T_1$'s credit of ₹100 is completely lost! Balance should be ₹900, but is ₹800.

---

### 2. The Dirty Read / Temporary Update Anomaly (2 Marks)
**Occurs when:** Transaction $T_1$ updates item $X$, and transaction $T_2$ reads the updated value of $X$ **before** $T_1$ commits. If $T_1$ subsequently fails and aborts, $T_2$ has worked with phantom/invalid data that never legally existed.
- **Timeline Example:**
  - $t_1: T_1$ writes $X = 5000$ (uncommitted update)
  - $t_2: T_2$ reads $X = 5000$ and calculates discount based on it
  - $t_3: T_1$ encounters an error and executes \`ROLLBACK\` (restoring $X = 2000$)
- **Result:** $T_2$ used an uncommitted value of ₹5000 that was discarded.

---

### 3. The Unrepeatable Read / Inconsistent Analysis Anomaly (2 Marks)
**Occurs when:** Transaction $T_1$ reads item $X$. While $T_1$ is still running, transaction $T_2$ modifies or deletes $X$ and commits. When $T_1$ re-reads $X$ within the same transaction, it observes a different value.
- **Timeline Example:**
  - $t_1: T_1$ reads $X = 500$
  - $t_2: T_2$ writes $X = 900$ and commits
  - $t_3: T_1$ reads $X$ again, finding $X = 900$
- **Result:** Within the same transaction, reading $X$ produces inconsistent results.

---

### Concurrency Solution (1 Mark):
DBMS resolves these using **Strict Two-Phase Locking (Strict 2PL)** or SQL Isolation Levels (\`REPEATABLE READ\` / \`SERIALIZABLE\`), holding exclusive locks on updated items until transaction commit/rollback.`,
    keyPoints: [
      "Lost Update timeline and data overwriting",
      "Dirty read: reading uncommitted data followed by rollback",
      "Unrepeatable read: different values upon re-reading within same transaction",
      "Strict 2PL and isolation levels as remedy"
    ],
    commonMistakes: [
      "Failing to mention the rollback in Dirty Read.",
      "Confusing Unrepeatable Read with Dirty Read."
    ]
  },
  {
    id: "q_decomp_10m",
    subjectId: "cs201",
    subjectCode: "CS201",
    unitNumber: 3,
    topic: "Boyce-Codd Normal Form (BCNF) & 4NF",
    text: "A comprehensive university exam question on Database Normalization: Given relational schema R(A, B, C, D, E, F) with FDs: { A -> BC, CD -> E, B -> D, E -> A }. \n(a) Compute candidate keys of R. \n(b) Identify the highest normal form of R. \n(c) Demonstrate step-by-step lossless decomposition into 3NF and BCNF, checking dependency preservation. (10 Marks)",
    marks: 10,
    difficulty: "Hard",
    type: "Numerical",
    isBookmarked: true,
    markingCriteria: [
      "2 Marks: Candidate keys computation with step-by-step attribute closure derivations.",
      "2 Marks: Identifying prime vs non-prime attributes.",
      "2 Marks: Determining highest normal form of original schema with clear violation reasoning.",
      "2 Marks: Lossless decomposition into 3NF using synthesis algorithm.",
      "2 Marks: BCNF decomposition and testing dependency preservation."
    ],
    modelAnswer: `### (a) Candidate Keys Computation (2 Marks)
Attributes present in $R$: $\{A, B, C, D, E, F\}$.
Notice that attribute **$F$** does not appear on the right-hand side of any functional dependency. Hence, **$F$ must be part of every candidate key**.

Let us test attribute closures containing $F$:
1. Check $(AF)^+$:
   - $(AF)^+ = \{A, F\} \\rightarrow$ using $A \\rightarrow BC \\implies \\{A, B, C, F\\}$
   - Using $B \\rightarrow D \\implies \\{A, B, C, D, F\\}$
   - Using $CD \\rightarrow E \\implies \\{A, B, C, D, E, F\\} = R$.
   - Hence, **$AF$ is a Candidate Key**.

2. Check $(EF)^+$:
   - Using $E \\rightarrow A \\implies (EF)^+ = (AF)^+ = R$.
   - Hence, **$EF$ is a Candidate Key**.

3. Check $(CDF)^+$:
   - Using $CD \\rightarrow E \\implies (CDF)^+ = (EF)^+ = R$.
   - Hence, **$CDF$ is a Candidate Key**.

4. Check $(BCF)^+$:
   - Using $B \\rightarrow D \\implies (BCDF)^+ = (CDF)^+ = R$.
   - Hence, **$BCF$ is a Candidate Key**.

**Candidate Keys:** \`{AF, EF, BCF, CDF}\`

---

### (b) Prime Attributes & Highest Normal Form (2 Marks)
- **Prime Attributes:** $\{A, B, C, D, E, F\}$ (All attributes are prime!).
- **Non-Prime Attributes:** None ($\emptyset$).

**Testing Normal Forms:**
- **1NF:** Satisfied (all attributes atomic).
- **2NF:** Requires no non-prime attribute to depend on a proper subset of any candidate key. Since there are **no non-prime attributes**, 2NF is **trivially satisfied**!
- **3NF:** For every FD $X \\rightarrow Y$, either $X$ is a superkey OR $Y$ consists of prime attributes. Since ALL attributes are prime, the condition that $Y$ is prime holds for all FDs!
- **Hence, R is in 3NF.**

**Check BCNF:**
- For $A \\rightarrow BC$: Is $A$ a superkey of $R$? **NO** (needs $F$ to be a superkey).
- Hence, **$R$ is in 3NF, but NOT in BCNF.**
**Highest Normal Form: 3NF.**

---

### (c) Synthesis into 3NF & BCNF (4 Marks)
**3NF Synthesis Algorithm:**
1. Find minimal cover of $F$: $\{A \\rightarrow B, A \\rightarrow C, CD \\rightarrow E, B \\rightarrow D, E \\rightarrow A\}$.
2. Group FDs with identical determinants:
   - $R_1(A, B, C)$ with $A \\rightarrow BC$
   - $R_2(C, D, E)$ with $CD \\rightarrow E$
   - $R_3(B, D)$ with $B \\rightarrow D$
   - $R_4(E, A)$ with $E \\rightarrow A$
3. Add a candidate key relation: None of $R_1..R_4$ contains $F$. Add candidate key relation $R_5(A, F)$.
4. **Final 3NF Decomposition:** $R_1(A, B, C), R_2(C, D, E), R_3(B, D), R_4(E, A), R_5(A, F)$.
   - **Guarantees:** Lossless Join + Dependency Preservation!

**BCNF Decomposition:**
Decomposing non-superkey determinants decomposes $R$ into relations where every determinant is a superkey, but the dependency $CD \\rightarrow E$ is split and cannot be preserved without an expensive cross-table join.`,
    keyPoints: [
      "Attribute F must belong to all candidate keys",
      "All attributes are prime => 2NF and 3NF automatically satisfied",
      "BCNF fails because determinants A, B, CD lack attribute F",
      "Bernstein's 3NF synthesis algorithm demonstrated"
    ],
    commonMistakes: [
      "Forgetting attribute F when computing candidate keys.",
      "Failing to note that all attributes being prime guarantees 3NF."
    ]
  }
];

export const DEMO_QUIZ_SESSION: QuizSession = {
  id: "quiz_dbms_midterm_1",
  title: "DBMS Unit 3: Normalization & Transaction Mastery",
  subject: "Database Management Systems (CS201)",
  durationMinutes: 15,
  totalMarks: 20,
  questions: [
    {
      id: "qz_1",
      type: "mcq",
      question: "Which of the following normal forms eliminates partial functional dependencies on composite candidate keys?",
      marks: 2,
      topic: "1NF, 2NF and 3NF Normalization",
      options: [
        "First Normal Form (1NF)",
        "Second Normal Form (2NF)",
        "Third Normal Form (3NF)",
        "Boyce-Codd Normal Form (BCNF)"
      ],
      correctAnswer: 1,
      explanation: "2NF is defined as being in 1NF and having every non-prime attribute fully functionally dependent on every candidate key, thereby removing partial dependencies."
    },
    {
      id: "qz_2",
      type: "mcq",
      question: "In Third Normal Form (3NF), for every non-trivial functional dependency X -> A, which condition is allowed that is strictly prohibited in BCNF?",
      marks: 2,
      topic: "Boyce-Codd Normal Form (BCNF) & 4NF",
      options: [
        "X is a superkey of the relation",
        "A is a non-prime attribute",
        "A is a prime attribute (part of any candidate key)",
        "X and A belong to the same composite key"
      ],
      correctAnswer: 2,
      explanation: "3NF allows the relaxation where A is a prime attribute even if X is not a superkey. BCNF strictly eliminates this relaxation, requiring X to always be a superkey."
    },
    {
      id: "qz_3",
      type: "mcq",
      question: "If a schedule's precedence graph contains a directed cycle T1 -> T2 -> T3 -> T1, what does this mathematically prove?",
      marks: 2,
      topic: "Serializability & Conflict Precedence",
      options: [
        "The schedule is in strict 2PL",
        "The schedule is NOT conflict serializable",
        "The schedule is guaranteed to be deadlock-free",
        "The schedule is view serializable"
      ],
      correctAnswer: 1,
      explanation: "By the serializability theorem, a schedule is conflict serializable if and only if its precedence graph is acyclic. A cycle proves that no topological order exists, meaning the schedule is not conflict serializable."
    },
    {
      id: "qz_4",
      type: "mcq",
      question: "Which ACID property is primarily preserved by Write-Ahead Logging (WAL) and checkpoint recovery mechanisms?",
      marks: 2,
      topic: "Transaction Concepts & ACID Properties",
      options: [
        "Atomicity & Durability",
        "Isolation & Consistency",
        "Physical Data Independence",
        "Referential Integrity"
      ],
      correctAnswer: 0,
      explanation: "Write-Ahead Logging ensures that log records are flushed to non-volatile disk before database buffers, allowing REDO (Durability) and UNDO (Atomicity) during crash recovery."
    },
    {
      id: "qz_5",
      type: "mcq",
      question: "In a B+ Tree index, why are range queries significantly faster than in a traditional B-Tree?",
      marks: 2,
      topic: "B-Trees and B+ Trees Architecture",
      options: [
        "B+ Trees have fewer total nodes",
        "All leaf nodes are linked sequentially via a linked list",
        "Internal nodes hold all the data records",
        "B+ Trees never split nodes on insertion"
      ],
      correctAnswer: 1,
      explanation: "In B+ Trees, all leaf nodes reside at the same lowest level and are connected via bidirectional pointers (linked list). Once the start key is located, the remainder of the range is retrieved via rapid sequential traversal."
    },
    {
      id: "qz_6",
      type: "short",
      question: "Given a relation R(A, B, C) where A -> B and B -> C, state the name of the anomaly prevented by decomposing R into R1(A, B) and R2(B, C).",
      marks: 5,
      topic: "1NF, 2NF and 3NF Normalization",
      correctAnswer: "Transitive Dependency",
      explanation: "A -> B and B -> C represents a Transitive Dependency (A -> C via non-prime B), which causes insertion, update, and deletion anomalies. Decomposing into R1(A, B) and R2(B, C) achieves 3NF."
    },
    {
      id: "qz_7",
      type: "short",
      question: "What is the lock-holding requirement of 'Strict Two-Phase Locking' compared to basic 2PL?",
      marks: 5,
      topic: "Concurrency Protocols & 2PL",
      correctAnswer: "Hold exclusive locks until transaction commit",
      explanation: "Strict 2PL requires that all exclusive (write) locks acquired by a transaction must be held until the transaction finishes (commits or aborts), completely preventing cascading rollbacks."
    }
  ]
};

export const INITIAL_REVISION_TASKS: RevisionTask[] = [
  {
    id: "rev_1",
    title: "Review BCNF Determinant Rule & Dependency Loss Trade-offs",
    subject: "Database Management Systems",
    topicId: "t3_3",
    priority: "high",
    reason: "Evaluator Weakness",
    dueDate: "Today, 08:00 PM",
    timeEstimateMinutes: 25,
    completed: false
  },
  {
    id: "rev_2",
    title: "Practise Precedence Graph Cycle Detection Problems",
    subject: "Database Management Systems",
    topicId: "t4_2",
    priority: "high",
    reason: "Quiz Miss",
    dueDate: "Tomorrow, 10:00 AM",
    timeEstimateMinutes: 30,
    completed: false
  },
  {
    id: "rev_3",
    title: "Verify A* Search Heuristic Admissibility Proofs",
    subject: "Artificial Intelligence Foundations",
    topicId: "ai_t2_1",
    priority: "medium",
    reason: "Scheduled Spaced Repetition",
    dueDate: "Oct 12, 2026",
    timeEstimateMinutes: 20,
    completed: true,
    dateCompleted: "Yesterday"
  },
  {
    id: "rev_4",
    title: "Re-read 3-Schema ANSI/SPARC Data Independence",
    subject: "Database Management Systems",
    topicId: "t1_1",
    priority: "low",
    reason: "User Pinned",
    dueDate: "Oct 14, 2026",
    timeEstimateMinutes: 15,
    completed: false
  }
];

export const MULTILINGUAL_EXPLANATIONS = {
  normalization: {
    en: {
      title: "Database Normalization (English)",
      summary: "Database Normalization is the process of structuring relational tables to eliminate redundancy and prevent data anomalies (Insertion, Deletion, Update).",
      analogy: "Think of organizing a messy wardrobe: Instead of tossing all clothes, socks, and shoes into one drawer, you separate them into designated compartments so changing one pair of socks doesn't ruin the whole stack.",
      stepByStep: [
        "1NF: Ensure all attributes contain atomic (indivisible) values and no repeating groups.",
        "2NF: Meet 1NF + remove partial dependencies (every non-key attribute must depend on the FULL composite candidate key).",
        "3NF: Meet 2NF + remove transitive dependencies (non-key attributes cannot depend on other non-key attributes).",
        "BCNF: Ensure that for EVERY functional dependency X -> Y, determinant X is a superkey."
      ],
      examPoints: [
        "Primary goal: Prevent update, insertion, and deletion anomalies.",
        "3NF allows A to be prime attribute; BCNF strictly requires X to be a superkey.",
        "Lossless join decomposition is essential to prevent spurious tuples."
      ]
    },
    hi: {
      title: "डेटाबेस सामान्यीकरण (Database Normalization in Hindi)",
      summary: "डेटाबेस नॉर्मलाइजेशन रिलेशनल डेटाबेस में डेटा को व्यवस्थित करने की एक वैज्ञानिक प्रक्रिया है ताकि डेटा दोहराव (Redundancy) को कम किया जा सके और विसंगतियों (Anomalies) को रोका जा सके।",
      analogy: "सरल उदाहरण: जैसे एक बड़ी अलमारी में कपड़े, जूते और किताबें एक साथ रखने के बजाय हम अलग-अलग रैक बनाते हैं, वैसे ही डेटाबेस में अलग-अलग टेबल बनाए जाते हैं।",
      stepByStep: [
        "1NF (पहला सामान्य रूप): टेबल में प्रत्येक कॉलम में केवल एकल (परमाणु / Atomic) मान होना चाहिए।",
        "2NF (दूसरा सामान्य रूप): 1NF के नियमों का पालन करें और आंशिक निर्भरता (Partial Dependency) को हटाएं।",
        "3NF (तीसरा सामान्य रूप): 2NF के नियमों का पालन करें और सकर्मक निर्भरता (Transitive Dependency) को हटाएं।",
        "BCNF (बॉयस-कॉड सामान्य रूप): प्रत्येक कार्यात्मक निर्भरता (X -> Y) में निर्धारक X एक सुपर-कुंजी (Superkey) होना चाहिए।"
      ],
      examPoints: [
        "मुख्य उद्देश्य: इन्सर्शन, अपडेशन और डिलीशन की समस्याओं को समाप्त करना।",
        "3NF और BCNF के बीच का मुख्य अंतर याद रखें।",
        "परीक्षा में हमेशा एक उदाहरण टेबल बनाकर अपघटन (Decomposition) दिखाएं।"
      ]
    },
    te: {
      title: "డేటాబేస్ నార్మలైజేషన్ (Database Normalization in Telugu)",
      summary: "డేటాబేస్ నార్మలైజేషన్ అనేది రిలేషనల్ డేటాబేస్‌లో డేటా పునరావృతం (Redundancy) మరియు తప్పులు (Anomalies) తొలగించడానికి పట్టికలను క్రమబద్ధీకరించే పద్ధతి.",
      analogy: "సులభమైన ఉదాహరణ: ఒక పెద్ద అల్మారాలో పుస్తకాలు, బట్టలు, ఇతర వస్తువులు ఒకే చోట కలపకుండా వేర్వేరు గదులలో సర్దుబాటు చేసినట్లు, డేటాబేస్‌లో పట్టికలను వేరు చేస్తాము.",
      stepByStep: [
        "1NF (మొదటి సాధారణ రూపం): పట్టికలోని ప్రతి విలువ విడదీయరానిదిగా (Atomic) ఉండాలి, పునరావృత సమూహాలు ఉండకూడదు.",
        "2NF (రెండవ సాధారణ రూపం): 1NF నిబంధనలు పాటించి, పాక్షిక ఆధారపడటాన్ని (Partial Dependency) తొలగించాలి.",
        "3NF (మూడవ సాధారణ రూపం): 2NF నిబంధనలు పాటించి, ట్రాన్సిటివ్ ఆధారపడటాన్ని (Transitive Dependency) తొలగించాలి.",
        "BCNF (బాయిస్-కాడ్ సాధారణ రూపం): ప్రతి ఫంక్షనల్ డిపెండెన్సీ (X -> Y) లో X తప్పనిసరిగా సూపర్‌కీ అయి ఉండాలి."
      ],
      examPoints: [
        "ముఖ్య లక్ష్యం: ఇన్సర్షన్, డిలీషన్ మరియు అప్‌డేట్ సమస్యలను నివారించడం.",
        "3NF మరియు BCNF మధ్య వ్యత్యాసం పరీక్షలలో తరచుగా అడిగే ప్రశ్న.",
        "నిరూపణకు విద్యార్థి/కోర్సు ఉదాహరణను ఉపయోగించండి."
      ]
    }
  }
};
