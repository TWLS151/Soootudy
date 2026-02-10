T = int(input())

dr = [-1, 1, 0, 0]
dc = [0, 0, -1, 1]

for tc in range(1, T+1):
    N = int(input())
    arr = [list(map(int, input().split())) for _ in range(N)]   # 0: 빈 공간, 1: 기둥, 2: 경비병

    # 1) 경비병의 위치 찾기
    guard = []     

    # visited 배열
    # visited[r][c] == True -> 이 칸은 경비병에게 "이미 보였다"
    # visited[r][c] == False -> 아직 안 보였다, 일단 전부 false로 만들어두기
    visited = [[False] * N for _ in range(N)]

    for r in range(N):
        for c in range(N):
            if arr[r][c] == 2:
                guard.append((r, c))

    # 2) 전체 0의 수 세기
    zero_cnt = 0
    for r in range(N):
        for c in range(N):
            if arr[r][c] == 0:
                zero_cnt += 1

    # 3) 경비병이 움직일 수 있는 위치 파악
    seen_cnt = 0    # 경비병이 본 0의 개수
    for gr, gc in guard:
        for i in range(4):
            for n in range(1, N):
                nr, nc = gr +dr[i] * n, gc + dc[i] * n

                if 0 <= nr < N and 0 <= nc < N:
                    if arr[nr][nc] == 1:    # 기둥(1)을 만나면 시야 차단 → 이 방향 종료
                        break
                    else:
                        if visited[nr][nc] == False:    # 아직 경비병에게 안 보인 칸이라면
                            seen_cnt += 1       # 본 빈 공간 개수 +1
                            visited[nr][nc] = True      # 이 칸은 "봤다" 표시
                        else:
                            continue    # 이미 본 칸이면 그냥 지나가기

    print(f'#{tc} {zero_cnt - seen_cnt}')


'''
Docstring for IM_대비_문제.im_경비병_문제 정리

<기출 문제: 경비병>
1. 경비병은 자신의 위치로부터 상하좌우로 N만큼 관찰할 수 있다.
2. 시야에 기둥이 있다면 기둥 뒤는 인식하지 못함
3. 경비병의 눈을 피해 숨어있을 공간이 몇 개 인지 출력하시오.

- 0: 빈 공간(숨을 수 있음)
- 1: 기둥(시야를 막음)
- 2: 경비병 (오직 1명)

# 정리: 경비병은 자기 위치에서
상/하/좌/우 으로만 봄 = 최대 N칸까지 볼 수 있음
(근데 어차피 맵 끝까지가 N칸이라 그냥 끝까지 본다고 생각해도 될 듯...)

기둥(1)을 만나면 그 뒤는 못 봄
경비병 눈에 보이는 0 칸은 “숨을 수 없음”

>>>> 경비병 눈에 안 보이는 0 칸만 세자 <<<<

경비병 시야에 안 걸리는 0의 개수 = 전체 0의 개수 - 경비병에게 보인 0 
'''