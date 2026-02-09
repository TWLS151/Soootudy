# import sys

# sys.stdin = open('4613.txt')

T = int(input())

for tc in range(1, T + 1):
    N, M = list(map(int, input().split()))
    arr = [list(map(str, input())) for _ in range(N)]

    f_count = 0

    # 첫 줄 W 확정시키기
    for i in range(M):
        if 'R'== arr[0][i]:
            f_count += 1
        if 'B'== arr[0][i]:
            f_count += 1
    
    # 마지막 줄 R 확정시키기
    for i in range(M):
        if 'W'== arr[N-1][i]:
            f_count += 1
        if 'B'== arr[N-1][i]:
            f_count += 1

    # 첫 줄과 마지막 줄 사이 구간을 어떻게 나누면 좋을까요...?
    # B 줄을 확정시키면 좋을 거 같은데요...
    # 를 고민하다가 막혀서 AI의 힌트를 받아 작성하였습니다.
    # (반복문만 잘 설계하면 첫 줄 W, 마지막 줄 R 조건이 자동으로 지켜진다네요...ㅠ)


    # 가능한 모든 경계선을 다 시도해보는 Brute Force

    # 최솟값을 최대로 칠할 수 있는 개수로 초기화
    m_count = N * M

    # 경계 i : B 줄 시작
    for i in range(1, N-1):  # 1 ~ N-2행
        # 경계 j : R 줄 시작
        for j in range(i+1, N):  # i+1 ~ N-1행
            c_count = 0

            # w 구간 : 1~ i-1행
            for r in range(1, i):
                for c in range(M):
                    if arr[r][c] != 'W':
                        c_count += 1
            # B 구간 : i~ j-1행
            for r in range(i, j):
                for c in range(M):
                   if arr[r][c] != 'B':
                       c_count += 1
            # R 구간 : j~ N-2행
            for r in range(j, N-1):
                for c in range(M):
                    if arr[r][c] != 'R':
                        c_count += 1
            # 최솟값 갱신
            if c_count < m_count:
                m_count = c_count

    print(f'#{tc} {f_count + m_count}')