T = int(input())

for tc in range(1, T + 1):
    N, M = map(int, input().split())    # N: 행의 개수, M: 열의 개수
    arr = [input().strip() for _ in range(N)]

    # 각 줄을 특정 색(W, B, R)으로 만들 때
    # 다시 칠해야 하는 칸의 수를 저장할 배열
    white = [0] * N
    blue = [0] * N
    red = [0] * N

     # 각 줄마다 개수 계산
    for i in range(N):
        white[i] = M - arr[i].count('W')
        blue[i] = M - arr[i].count('B')
        red[i] = M - arr[i].count('R')

    # 최솟값을 크게 잡아두기
    min_count = N * M

    # W / B / R 경계 정하기
    # i: 흰색(W)이 끝나는 마지막 줄 번호
    # j: 파란색(B)이 끝나는 마지막 줄 번호
    for i in range(N - 2):          # W는 최소 1줄
        for j in range(i + 1, N - 1):  # B는 최소 1줄

            # i, j는 W/B 영역의 끝 줄
            # 각 색은 최소 1줄씩 있어야 하므로
            # i는 0 ~ N-3, j는 i+1 ~ N-2 까지만 가능..

            count = 0

            # W 영역
            for r in range(0, i + 1):
                count += white[r]

            # B 영역
            for r in range(i + 1, j + 1):
                count += blue[r]

            # R 영역
            for r in range(j + 1, N):
                count += red[r]

            # 최솟값 갱신
            if count < min_count:
                min_count = count

    print(f'#{tc} {min_count}')

'''
# 풀기 전 먼저 글로 써보기
1. 문제를 줄 단위로 해석한다.
2. 각 줄을 W/B/R로 만들 때 다시 칠해야 하는 칸 수를 미리 계산한다.
3. 가능한 모든 줄 경계를 순회하며 경우를 확인해보자...
4. 마지막으로 다시 칠해야 하는 칸의 개수가 최소가 되는 경우를 선택하기!
'''