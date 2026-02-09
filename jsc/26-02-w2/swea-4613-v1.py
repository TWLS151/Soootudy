import sys
# sys.stdin = open('like_russian.txt')

TC = int(input())

for test_case in range(1, TC + 1):
    N, M = map(int, input().split())  # height, width 대신 N, M으로 깔끔하게
    flag = [input() for _ in range(N)]
    
    # 1. 최솟값은 넉넉하게 전체 칸 수로...
    min_paint = N * M
    
    # 2. i와 j를 경계선으로 잡고 브루탈 포스
    # i는 흰색 구역의 끝, j는 파란색 구역의 끝
    for i in range(N - 2):
        for j in range(i + 1, N - 1):
            current_count = 0
            
            # 각 구역별로 나누어서 칠해야 할 개수(전체 폭 - 해당 색깔 개수) 계산
            
            # 흰색 영역: 0번부터 i번 줄까지
            white_zone = flag[:i + 1]
            for row in white_zone:
                current_count += (M - row.count('W'))
                
            # 파란색 영역: i+1번부터 j번 줄까지
            blue_zone = flag[i + 1 : j + 1]
            for row in blue_zone:
                current_count += (M - row.count('B'))
                
            # 빨간색 영역: j+1번부터 끝까지
            red_zone = flag[j + 1:]
            for row in red_zone:
                current_count += (M - row.count('R'))
            
            # 3. 매 경우의 수마다 최솟값 갱신
            if min_paint > current_count:
                min_paint = current_count
                
    print(f'#{test_case} {min_paint}')