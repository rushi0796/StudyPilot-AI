import { 
  getInitials, 
  formatDisplayName, 
  isProfileValid 
} from '../src/utils/profileUtils.ts';
import { 
  retrieveRelevantChunks, 
  formatRetrievedContext 
} from '../src/services/ragEngine.ts';
import { 
  searchDocuments, 
  type DocumentChunkContext 
} from '../api/chat.ts';
import { 
  filterDocumentsForUser 
} from '../src/services/storageService.ts';
import type { UploadedDocument } from '../src/types/index.ts';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runProfileAndRagTests() {
  console.log('\n======================================================');
  console.log('STUDYPILOT AI - PROFILE IDENTITY & RAG PIPELINE TESTS');
  console.log('======================================================\n');

  // TEST SUITE 1: Profile Initials Single Source of Truth
  console.log('1. Testing Avatar Initials Generator (getInitials):');
  assert(getInitials('Imam Hussain') === 'IH', 'Generates "IH" for "Imam Hussain"');
  assert(getInitials('Aken Rushikesh Gopal') === 'AR', 'Generates "AR" for "Aken Rushikesh Gopal"');
  assert(getInitials('Rushikesh') === 'R', 'Generates "R" for single-word "Rushikesh"');
  assert(getInitials('  Lajaree   Ashish  ') === 'LA', 'Handles leading, trailing, and multiple spaces: "LA"');
  assert(getInitials('Dasari Aswan Kumar') === 'DA', 'Generates "DA" for "Dasari Aswan Kumar"');
  assert(getInitials('') === 'ST', 'Returns fallback "ST" for empty string');
  assert(getInitials('   ') === 'ST', 'Returns fallback "ST" for whitespace-only string');
  assert(getInitials(null) === 'ST', 'Returns fallback "ST" for null');
  assert(getInitials(undefined) === 'ST', 'Returns fallback "ST" for undefined');

  // TEST SUITE 2: Compact Display Name Formatter
  console.log('\n2. Testing Display Name Formatter (formatDisplayName):');
  assert(formatDisplayName('Imam Hussain') === 'Imam H.', 'Formats "Imam Hussain" as "Imam H."');
  assert(formatDisplayName('Aken Rushikesh Gopal') === 'Aken R.', 'Formats "Aken Rushikesh Gopal" as "Aken R."');
  assert(formatDisplayName('Rushikesh') === 'Rushikesh', 'Preserves single-word name "Rushikesh"');
  assert(formatDisplayName('') === 'Student', 'Falls back to "Student" for empty name');
  assert(formatDisplayName(null) === 'Student', 'Falls back to "Student" for null');

  // TEST SUITE 3: Profile Validity & Onboarding Guards
  console.log('\n3. Testing Profile Validation (isProfileValid):');
  assert(isProfileValid({ name: 'Imam Hussain', onboardingCompleted: true }) === true, 'Valid profile with name and onboardingCompleted is recognized');
  assert(isProfileValid({ name: 'Aken Rushikesh', onboardingCompleted: true }) === true, 'Profile for Aken Rushikesh is valid');
  assert(isProfileValid({ name: '', onboardingCompleted: true }) === false, 'Rejects profile with empty name even if onboardingCompleted is true');
  assert(isProfileValid({ name: '   ', onboardingCompleted: true }) === false, 'Rejects profile with whitespace-only name');
  assert(isProfileValid({ name: 'Imam Hussain', onboardingCompleted: false }) === false, 'Rejects profile where onboardingCompleted is false');
  assert(isProfileValid(null) === false, 'Rejects null profile');
  assert(isProfileValid({}) === false, 'Rejects empty object profile');

  // TEST SUITE 4: RAG Multi-Term Coverage & False Positive Prevention
  console.log('\n4. Testing RAG Multi-Term Coverage & Precision:');
  const sampleChunks = [
    {
      id: 'chunk_1',
      documentId: 'doc_dbms',
      documentName: 'Unit_3_DBMS_Normalization.pdf',
      chunkIndex: 0,
      content: 'In DBMS, relational database normalization organizes tables to reduce redundancy. Third Normal Form (3NF) requires 2NF and no transitive dependency where non-prime attributes depend on candidate keys.',
      pageOrSection: 'Page 4, Section 3.1'
    },
    {
      id: 'chunk_2',
      documentId: 'doc_dbms',
      documentName: 'Unit_3_DBMS_Normalization.pdf',
      chunkIndex: 1,
      content: 'Boyce-Codd Normal Form (BCNF) is a stricter variant of 3NF in DBMS. Every determinant X in a functional dependency X -> Y must be a candidate key.',
      pageOrSection: 'Page 8, Section 3.4'
    },
    {
      id: 'chunk_3',
      documentId: 'doc_networks',
      documentName: 'Computer_Networks_Unit_2.pdf',
      chunkIndex: 0,
      content: 'The Transmission Control Protocol (TCP) provides reliable, ordered, and error-checked delivery of a stream of octets between applications running on hosts communicating via an IP network.',
      pageOrSection: 'Page 12, Section 2.3'
    }
  ];

  // Query 1: "What is 3NF in DBMS?" -> Should match chunk_1
  const match3NF = retrieveRelevantChunks('What is 3NF in DBMS?', sampleChunks, 2);
  assert(match3NF.length > 0, 'Retrieves chunk for specific question "What is 3NF in DBMS?"');
  assert(match3NF[0].chunk.id === 'chunk_1', 'Ranks chunk_1 as top match for 3NF query');
  assert(match3NF[0].citation.includes('Unit_3_DBMS_Normalization.pdf'), 'Citation includes correct document name');

  // Query 2: "What is the full form of DBMS?"
  // None of the chunks explain the full form ("full" and "form" are absent).
  // The system must NOT return chunk_1 or chunk_2 merely because "dbms" appears!
  const falsePositiveQuery = retrieveRelevantChunks('What is the full form of DBMS?', sampleChunks, 2);
  assert(falsePositiveQuery.length === 0, 'Does NOT falsely return normalization chunks when asked "What is the full form of DBMS?"');

  // TEST SUITE 5: Server-side searchDocuments in api/chat.ts
  console.log('\n5. Testing Server-Side searchDocuments Implementation:');
  const serverChunks: DocumentChunkContext[] = sampleChunks.map(c => ({
    documentName: c.documentName,
    pageOrSection: c.pageOrSection,
    content: c.content
  }));

  const server3NFMatches = searchDocuments('What is 3NF in DBMS?', serverChunks);
  assert(server3NFMatches.length > 0, 'Server-side searchDocuments finds 3NF passage');
  assert(server3NFMatches[0].text.includes('Third Normal Form'), 'Matched passage contains Third Normal Form definition');

  const serverFullFormMatches = searchDocuments('What is the full form of DBMS?', serverChunks);
  assert(serverFullFormMatches.length === 0, 'Server-side searchDocuments rejects query missing key terms ("full", "form")');

  // TEST SUITE 6: Document Context Formatting
  console.log('\n6. Testing RAG Grounded Context & Citation Formatter:');
  const formatted = formatRetrievedContext(match3NF);
  assert(formatted.contextText.includes('### USER\'S UPLOADED STUDY MATERIALS'), 'Context includes Ground Truth section header');
  assert(formatted.contextText.includes('Page 4, Section 3.1'), 'Context includes exact page and section metadata');
  assert(formatted.citations.length === 2, 'Extracts citations for retrieved passages');
  assert(formatted.citations[0].includes('Unit_3_DBMS_Normalization.pdf'), 'Citation specifies source document');

  // Verify deduplication when duplicate chunks are passed
  const deduplicated = formatRetrievedContext([match3NF[0], match3NF[0]]);
  assert(deduplicated.citations.length === 1, 'Generates deduplicated citations array');

  // TEST SUITE 7: Cross-Student Document Isolation & Privacy Guardrails
  console.log('\n7. Testing Cross-Student Document Isolation & Privacy:');
  const sharedDocs: UploadedDocument[] = [
    {
      id: 'doc_dbms_handout',
      name: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
      size: 10240,
      type: 'pdf',
      uploadedAt: 'Today',
      text: 'Sample syllabus',
      wordCount: 100,
      chunks: [],
      status: 'ready'
    },
    {
      id: 'doc_student_alpha_private',
      userId: 'usr_student_alpha_001',
      name: 'Alpha_Confidential_Midterm_Prep.pdf',
      size: 20480,
      type: 'pdf',
      uploadedAt: 'Today',
      text: 'Alpha personal notes',
      wordCount: 200,
      chunks: [],
      status: 'ready'
    },
    {
      id: 'doc_student_beta_private',
      userId: 'usr_student_beta_002',
      name: 'Beta_Private_Project_Draft.docx',
      size: 30720,
      type: 'docx',
      uploadedAt: 'Today',
      text: 'Beta personal notes',
      wordCount: 300,
      chunks: [],
      status: 'ready'
    }
  ];

  const docsForAlpha = filterDocumentsForUser(sharedDocs, 'usr_student_alpha_001');
  const docsForBeta = filterDocumentsForUser(sharedDocs, 'usr_student_beta_002');
  const docsForGuest = filterDocumentsForUser(sharedDocs, undefined);

  assert(docsForAlpha.some(d => d.id === 'doc_student_alpha_private'), 'User Alpha sees their own private document');
  assert(docsForAlpha.some(d => d.id === 'doc_dbms_handout'), 'User Alpha sees the preloaded curriculum document');
  assert(!docsForAlpha.some(d => d.id === 'doc_student_beta_private'), 'PRIVACY ENFORCED: User Alpha CANNOT see User Beta private document');

  assert(docsForBeta.some(d => d.id === 'doc_student_beta_private'), 'User Beta sees their own private document');
  assert(docsForBeta.some(d => d.id === 'doc_dbms_handout'), 'User Beta sees the preloaded curriculum document');
  assert(!docsForBeta.some(d => d.id === 'doc_student_alpha_private'), 'PRIVACY ENFORCED: User Beta CANNOT see User Alpha private document');

  assert(!docsForGuest.some(d => d.id === 'doc_student_alpha_private'), 'Guest user CANNOT see User Alpha private document');
  assert(!docsForGuest.some(d => d.id === 'doc_student_beta_private'), 'Guest user CANNOT see User Beta private document');

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedTests} of ${totalTests} assertions passed.`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runProfileAndRagTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
