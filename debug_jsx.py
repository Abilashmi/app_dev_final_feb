
import sys

def count_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = 0
    parens = 0
    brackets = 0
    tags = []
    
    in_comment = False
    in_string = False
    string_char = ''
    
    i = 0
    while i < len(content):
        c = content[i]
        
        if in_comment:
            if c == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_comment = False
                i += 1
            elif c == '\n' and line_comment:
                in_comment = False
        elif in_string:
            if c == string_char:
                if content[i-1] != '\\':
                    in_string = False
        else:
            if c == '"' or c == "'":
                in_string = True
                string_char = c
            elif c == '/' and i + 1 < len(content) and content[i+1] == '*':
                in_comment = True
                line_comment = False
                i += 1
            elif c == '/' and i + 1 < len(content) and content[i+1] == '/':
                in_comment = True
                line_comment = True
                i += 1
            elif c == '{':
                braces += 1
            elif c == '}':
                braces -= 1
            elif c == '(':
                parens += 1
            elif c == ')':
                parens -= 1
            elif c == '[':
                brackets += 1
            elif c == ']':
                brackets -= 1
            elif c == '<' and i + 1 < len(content) and content[i+1].isalpha():
                # Start of tag
                j = i + 1
                while j < len(content) and (content[j].isalnum() or content[j] == '.'):
                    j += 1
                tag = content[i+1:j]
                # Check for self-closing
                is_self_closing = False
                k = j
                while k < len(content) and content[k] != '>':
                    if content[k] == '/' and k + 1 < len(content) and content[k+1] == '>':
                        is_self_closing = True
                        break
                    k += 1
                if not is_self_closing:
                    tags.append(tag)
            elif c == '<' and i + 1 < len(content) and content[i+1] == '/' and content[i+2].isalpha():
                # End of tag
                j = i + 2
                while j < len(content) and (content[j].isalnum() or content[j] == '.'):
                    j += 1
                tag = content[i+2:j]
                if tags and tags[-1] == tag:
                    tags.pop()
                else:
                    print(f"Mismatched tag: expected closing for {tags[-1] if tags else 'none'}, found {tag}")
        i += 1
        
    print(f"Braces: {braces}")
    print(f"Parens: {parens}")
    print(f"Brackets: {brackets}")
    print(f"Open Tags: {tags}")

if __name__ == "__main__":
    count_braces(sys.argv[1])
