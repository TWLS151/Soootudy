T = int(input())

for tc in range(1, T + 1):
    N, M = map(int, input().split())
    flag = [list(input()) for _ in range(N)]

    min_cnt = N * M
    
    # 흰색, 파란색, 빨간색 구역을 나눌 두 개의 경계선을 설정
    # i: 파란색 영역이 시작되는 행의 인덱스
    for i in range(1, N - 1):
        # j: 빨간색 영역이 시작되는 행의 인덱스
        for j in range(i + 1, N):
            change_cnt = 0

            # 1. 흰색 구역 검사: 0번 행부터 i-1번 행까지
            for r in range(0, i):
                for c in range(M):
                    if flag[r][c] != 'W':
                        change_cnt += 1
            
            # 2. 파란색 구역 검사: i번 행부터 j-1번 행까지
            for r in range(i, j):
                for c in range(M):
                    if flag[r][c] != 'B':
                        change_cnt += 1
            
            # 3. 빨간색 구역 검사: j번 행부터 마지막(N-1) 행까지
            for r in range(j, N):            
                for c in range(M):
                    if flag[r][c] != 'R':
                        change_cnt += 1
            
            # 현재 경계선 설정에서의 총 변경 횟수가 기존 최솟값보다 작으면 갱신
            if min_cnt > change_cnt:
                min_cnt = change_cnt
            
    print(f'#{tc} {min_cnt}')