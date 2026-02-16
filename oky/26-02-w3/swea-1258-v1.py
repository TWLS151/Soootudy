T = int(input())

for tc in range(1, T + 1):
    n = int(input())
    storage = [list(map(int, input().split())) for _ in range(n)]

    chem = []    # 행열의 크기를 담을 리스트
    square = []  # 부분행렬 좌표 [시작r, 시작c, 끝r, 끝c] 기록

    for r in range(n):
        for c in range(n):
            # 현재 위치가 0이거나, 이미 발견된 사각형 내부일 경우 건너뜀
            for k in range(len(square)):
                if (storage[r][c] == 0
                        or (square[k][0] <= r < square[k][2]
                            and square[k][1] <= c < square[k][3])):
                    break
            else:
                # 새로운 행렬의 시작점을 찾은 경우
                i, j = 1, 1
                # 가로 길이(열) 측정
                while c + j < n and storage[r][c + j] != 0:
                    j += 1
                # 세로 길이(행) 측정
                while r + i < n and storage[r + i][c] != 0:
                    i += 1

                chem.append([i, j])  # 행렬 크기 저장
                square.append([r, c, r + i, c + j])  # 영역 기록하여 중복 방지

    # 1) 면적(행*열), 2) 행 크기 기준 오름차순 정렬
    chem.sort(key=lambda x: (x[0] * x[1], x[0]))

    print(f'#{tc} {len(chem)}', end=' ')
    for i in range(len(chem)):
        print(*chem[i], end=' ')
    print()