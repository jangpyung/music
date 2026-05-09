import sys

def main():
    try:
        with open('d:/작업/장평/뮤직/player/260509/music-main/index.html', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        new_lines = []
        for i, line in enumerate(lines):
            # 35 to 527: index 35 is line 36 (1-indexed)
            if 35 <= i <= 527:
                continue
            if 712 <= i <= 1066:
                continue
            new_lines.append(line)
        
        new_lines.append('</body>\n</html>\n')
        
        with open('d:/작업/장평/뮤직/player/260509/music-main/index.html', 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
            
        print("Success")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
