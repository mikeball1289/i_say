
# I Say
I Say is a language focused on writing code that reads like English. 

## Syntax

### Symbols
The only required symbol in I Say is `"`, it's used to combine multiple words into a single syntantic block. For example `let "my number" be two.` Punctuation, capitalization, and spacing is optional, feel free to include periods, commas, newlines, and capitals as you see fit for easiest reading.

### Printing
To output a literal or value say `Tell me` or `Show me` followed by the value you want to print.
```
Tell me "Hello, World!"
```

### Variables
Any literal value can be a variable name. Declarations and assignments follow the same syntax, if a variable name hasn't been declared it will be implicitly declared, assign variables by saying `let {name} be {value}`. To unpack the value of a variable say `the value of {name}` otherwise the variable name will be treated as a literal. Numbers and strings are supported, you can write numbers in decimal notation but English number names is idiomatic for I Say.
```
Let "my greeting" be "Hello, World!".
Let "my number" be fourty-two.
Tell me the value of "my greeting".
Show me the value of "my number".
```

### Operators
I Say supports a number of operators, some infix some prefix. The prefix operators are:
`The sum of {a} and {b}` adds a and b
`The product of {a} and {b}` multiplies a and b
`The difference of {a} and {b}` subtracts b from a
`The difference between {a} and {b}` takes the absolute difference between a and b, useful for writing more natural sentences.
The infix operators are
`{a} divided by {b}` divides a by b
`{a} is less than {b}` evaluates a < b
`{a} is greater than {b}` evaluates a > b
`{a} is equal to {b}` evaluates a == b
`{a} is different from {b}` evaluates a != b
Infix operators are all always right associative (so `twelve divided by four divided by three` is 6) and there's no way to define evaluation order, so you'll need to use intermediate variables to make sure they evaluate correctly.

### Directives
Because I Say doesn't have very robust assignment there are a number of state-changing directives. They are: `ask me` `let's` `increment` and `decrement` and are used like
`Ask me "Give me a number:" and call it "my number".` prompts "Give me a number: " to the console and stores the user input in the variable "my number". Note that user input is parsed natively, so the input "forty-two" is the number 42.
`Let's "add two numbers" where a is two and b is four and call it "the result".` calls the function "add two numbers" with parameters a = 2 and b = 4, and stores the result in "the result". See Functions for more details.
`Increment "my number".` increase the value of "my number" by one.
`Decrement "my number".` decrease the value of "my number" by one.

### Statement Blocks
All control bodies in I Say take a single statement or statement block. Statement blocks group multiple statements together in a list and run them sequentially. The first statement in a statement block begins with `First` or `You should` and the last begins with `And lastly` or `Finally`. Statements between the first and last begin with `Then`
```
First tell me "This is the first line"
Then tell me "This is the second line"
Finally tell me "This is the last line"
```

### Control Flow
You can control the flow of your program with if statements and while loops. An if statement also optionally has an otherwise (else) branch. If statements are simply `If {condition} [then] [you] {body} otherwise {body}` the "then" and "you" words are optional to  make the program read better. To use a while loop say `As long as {condition} [then] [you] body`.
```
Ask me "Give me a number:" and call it n.
If the value of n is greater than ten then tell me "That number is higher than ten."
Otherwise tell me "That number is not higher than ten."
```
```
Let counter be ten. As long as the value of counter is greater than zero,
you first tell me the value of counter, and lastly let counter be the
difference of the value of counter and one.
```

### Functions
Functions are initialized with a name and optional parameters. To declare a function say `I'll explain how to` followed by the function name. To include function parameter named `{param}` say `I'll tell you what {param} is`, multiple parameters are separated by `and`. Function headers are followed immediately by a statement or statement block for their body. To return from a function use the statement `The answer is {value}`
```
I'll explain how to "add two numbers".
I'll tell you what a is and I'll tell you what b is.
The answer is the sum of the value of a and the value of b.
```
To call a function use the `Let's` directive. Provide parameter values with `where {param} is {value}` separating multiple parameters with `and`. Parameters can be listed in any order. You can store the result of the function with `and call it {name}`.
```
Let's "add two numbers" where b is five and a is two and call it "the result".
Show me the value of "the result".
```

### Misc
Undefined variables or assigning functions with no returns will create `undefined`.
Comparing two strings with `is less than` or `is greater than` will perform lexical comparison.
You don't need to quote strings that contain only a single word, you only need quotes if there's a space.
You can generate random numbers with the built-in value `A random number between {lowerbound} and {upperbound}.`

### Examples
`guess_the_number.is` A guess-the-number game, guess numbers between 0 and 99, it'll tell you if your guess was too high or too low
```
I'll explain how to "play Guess the Number".
First let n be a random number between zero and ninety-nine.
Then tell me "I'm thinking of a number between zero and ninety-nine".
Then ask me "Guess what it is?" and call it "my guess".
Then as long as the value of "my guess" is different from the value of n,
    then first, if the value of "my guess" is greater than the value of n, tell me "too high",
        otherwise tell me "too low".
    And lastly ask me "Guess again?" and call it "my guess".
And lastly tell me "You got it right!".

Let's "play Guess the Number"
```

`fibs.is` Recursively calculate the nth Fibonacci number
```
I'll explain how to "calculate the nth fibonacci number" 
I'll tell you what n is 
First, if the value of n is less than two then the answer is one
Then, decrement n, then let's "calculate the nth fibonacci number" where n is the value of n and call it a
Then, decrement n, then let's "calculate the nth fibonacci number" where n is the value of n and call it b
Finally, the answer is the sum of the value of a and the value of b

Tell me "I can calculate fibonacci numbers!"
Ask me "Which one should I calculate?" and call it n
Let's "calculate the nth fibonacci number"
Where n is the value of n and call it "the result"
Tell me the value of "the result"
```