/**
 * Error Message Decoder
 * Spec Section 10: Decode real toolchain error output into plain-language explanations,
 * root causes, and targeted lesson links.
 */

export interface DecodedError {
  errorType: string;
  rawErrorText: string;
  plainLanguageExplanation: string;
  likelyCause: string;
  howToFix: string;
  targetLessonId: string;
  targetLessonTitle: string;
}

export class ErrorMessageDecoder {
  decode(errorTrace: string): DecodedError {
    const text = errorTrace.trim();

    if (text.includes('IndentationError') || text.includes('TabError')) {
      return {
        errorType: 'IndentationError',
        rawErrorText: text,
        plainLanguageExplanation: 'Python relies on indentation (spaces) to know which lines belong together inside a block. A line has uneven spacing or mixed tabs and spaces.',
        likelyCause: 'A code block after a colon (like if, for, or def) was not indented 4 spaces, or tabs and spaces were mixed.',
        howToFix: 'Ensure every block inside a statement is indented consistently with 4 spaces.',
        targetLessonId: 'python-01-syntax-and-execution',
        targetLessonTitle: 'Syntax and Running Code',
      };
    }

    if (text.includes('NameError')) {
      const match = text.match(/name '(\w+)' is not defined/);
      const name = match ? match[1] : 'variable';
      return {
        errorType: 'NameError',
        rawErrorText: text,
        plainLanguageExplanation: `Python encountered the identifier "${name}", but does not know what it is yet.`,
        likelyCause: `You tried to use "${name}" before assigning a value to it, or you made a spelling typo.`,
        howToFix: `Define "${name} = ..." before reading it, or check the spelling against your variable declaration.`,
        targetLessonId: 'python-02-variables-and-types',
        targetLessonTitle: 'Variables and Primitive Types',
      };
    }

    if (text.includes('TypeError') && text.includes('unsupported operand type')) {
      return {
        errorType: 'TypeError',
        rawErrorText: text,
        plainLanguageExplanation: 'You attempted to perform a mathematical or comparison operation on incompatible data types (like adding a word to a number).',
        likelyCause: 'Python does not automatically convert text (strings) into numbers during arithmetic.',
        howToFix: 'Convert the string to an integer or float using int() or float() before operating.',
        targetLessonId: 'python-03-operators',
        targetLessonTitle: 'Arithmetic, Comparison, and Logical Operators',
      };
    }

    if (text.includes('ZeroDivisionError')) {
      return {
        errorType: 'ZeroDivisionError',
        rawErrorText: text,
        plainLanguageExplanation: 'You attempted to divide a number by zero or perform modulo by zero.',
        likelyCause: 'In mathematics and computing, division by zero is undefined and illegal.',
        howToFix: 'Check that your denominator or divisor variable is not 0 using an if condition before dividing.',
        targetLessonId: 'python-03-operators',
        targetLessonTitle: 'Arithmetic, Comparison, and Logical Operators',
      };
    }

    if (text.includes('UnboundLocalError')) {
      return {
        errorType: 'UnboundLocalError',
        rawErrorText: text,
        plainLanguageExplanation: 'A function tried to read a variable that exists globally, but because you assigned to it inside the function, Python treated it as a local variable before it was created.',
        likelyCause: 'Assigning to a variable inside a function makes it local to that function unless declared "global".',
        howToFix: 'Pass the variable as a parameter or return the new value instead of modifying outer state.',
        targetLessonId: 'python-08-functions-scope',
        targetLessonTitle: 'Function Arguments and Variable Scope',
      };
    }

    // Default syntax/runtime fallback
    return {
      errorType: 'SyntaxError',
      rawErrorText: text,
      plainLanguageExplanation: 'Python encountered code that violates the grammatical rules of the language.',
      likelyCause: 'Missing colon (:), unclosed quotation mark or bracket, or misspelled keyword.',
      howToFix: 'Check the line indicated by the arrow (^) for missing colons, quotes, or parentheses.',
      targetLessonId: 'python-01-syntax-and-execution',
      targetLessonTitle: 'Syntax and Running Code',
    };
  }
}
