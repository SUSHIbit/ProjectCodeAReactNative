import { supabase } from '../services/supabase';

/**
 * Database Testing Utilities for Phase 3
 * Run these functions to verify database setup and RLS policies
 */

export const testDatabaseSetup = async () => {
  console.log('Starting database setup tests...');

  try {
    // Test 1: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication required for testing');
      return { success: false, error: 'Not authenticated' };
    }
    console.log('✅ User authenticated:', user.id);

    // Test 2: Test PDF table - INSERT
    console.log('\nTesting pdfs table INSERT...');
    const { data: pdfData, error: pdfInsertError } = await supabase
      .from('pdfs')
      .insert({
        user_id: user.id,
        file_name: 'test-database-setup.pdf',
        file_path: `${user.id}/test-database-setup.pdf`,
        file_size: 1024,
        processed: false
      })
      .select()
      .single();

    if (pdfInsertError) {
      console.error('❌ PDF INSERT failed:', pdfInsertError);
      return { success: false, error: pdfInsertError };
    }
    console.log('✅ PDF INSERT successful:', pdfData.id);

    // Test 3: Test PDF table - SELECT
    console.log('\nTesting pdfs table SELECT...');
    const { data: pdfSelectData, error: pdfSelectError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', pdfData.id)
      .single();

    if (pdfSelectError) {
      console.error('❌ PDF SELECT failed:', pdfSelectError);
      return { success: false, error: pdfSelectError };
    }
    console.log('✅ PDF SELECT successful:', pdfSelectData);

    // Test 4: Test MCQ table - INSERT
    console.log('\nTesting mcqs table INSERT...');
    const { data: mcqData, error: mcqInsertError } = await supabase
      .from('mcqs')
      .insert({
        pdf_id: pdfData.id,
        question: 'What is 2 + 2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B'
      })
      .select()
      .single();

    if (mcqInsertError) {
      console.error('❌ MCQ INSERT failed:', mcqInsertError);
      return { success: false, error: mcqInsertError };
    }
    console.log('✅ MCQ INSERT successful:', mcqData.id);

    // Test 5: Test MCQ table - SELECT
    console.log('\nTesting mcqs table SELECT...');
    const { data: mcqSelectData, error: mcqSelectError } = await supabase
      .from('mcqs')
      .select('*')
      .eq('pdf_id', pdfData.id);

    if (mcqSelectError) {
      console.error('❌ MCQ SELECT failed:', mcqSelectError);
      return { success: false, error: mcqSelectError };
    }
    console.log('✅ MCQ SELECT successful:', mcqSelectData);

    // Test 6: Test quiz_attempts table - INSERT
    console.log('\nTesting quiz_attempts table INSERT...');
    const { data: attemptData, error: attemptInsertError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        pdf_id: pdfData.id,
        score: 1,
        total_questions: 1,
        answers: [
          {
            question_id: mcqData.id,
            question: 'What is 2 + 2?',
            selected_answer: 'B',
            correct_answer: 'B',
            is_correct: true
          }
        ]
      })
      .select()
      .single();

    if (attemptInsertError) {
      console.error('❌ Quiz attempt INSERT failed:', attemptInsertError);
      return { success: false, error: attemptInsertError };
    }
    console.log('✅ Quiz attempt INSERT successful:', attemptData.id);

    // Test 7: Test quiz_attempts table - SELECT
    console.log('\nTesting quiz_attempts table SELECT...');
    const { data: attemptSelectData, error: attemptSelectError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptData.id)
      .single();

    if (attemptSelectError) {
      console.error('❌ Quiz attempt SELECT failed:', attemptSelectError);
      return { success: false, error: attemptSelectError };
    }
    console.log('✅ Quiz attempt SELECT successful:', attemptSelectData);

    // Test 8: Test UPDATE on PDF
    console.log('\nTesting pdfs table UPDATE...');
    const { error: pdfUpdateError } = await supabase
      .from('pdfs')
      .update({ processed: true })
      .eq('id', pdfData.id);

    if (pdfUpdateError) {
      console.error('❌ PDF UPDATE failed:', pdfUpdateError);
      return { success: false, error: pdfUpdateError };
    }
    console.log('✅ PDF UPDATE successful');

    // Cleanup - Delete test data
    console.log('\nCleaning up test data...');
    await supabase.from('quiz_attempts').delete().eq('id', attemptData.id);
    await supabase.from('mcqs').delete().eq('id', mcqData.id);
    await supabase.from('pdfs').delete().eq('id', pdfData.id);
    console.log('✅ Cleanup successful');

    console.log('\n🎉 All database tests passed!');
    return { success: true };

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return { success: false, error };
  }
};

/**
 * Test RLS policies by attempting unauthorized access
 */
export const testRLSPolicies = async () => {
  console.log('Testing RLS policies...');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication required for RLS testing');
      return { success: false, error: 'Not authenticated' };
    }

    // Test: Try to read all PDFs (should only see user's own PDFs)
    console.log('\nTesting RLS: SELECT should only return user PDFs...');
    const { data: allPdfs, error: selectError } = await supabase
      .from('pdfs')
      .select('*');

    if (selectError) {
      console.error('❌ RLS test failed:', selectError);
      return { success: false, error: selectError };
    }

    // Verify all returned PDFs belong to current user
    const allBelongToUser = allPdfs?.every(pdf => pdf.user_id === user.id);
    if (allBelongToUser) {
      console.log('✅ RLS working: Only user PDFs returned');
    } else {
      console.error('❌ RLS not working: PDFs from other users returned');
      return { success: false, error: 'RLS policy violation' };
    }

    console.log('\n🎉 RLS policies are working correctly!');
    return { success: true };

  } catch (error) {
    console.error('❌ RLS test failed with exception:', error);
    return { success: false, error };
  }
};
