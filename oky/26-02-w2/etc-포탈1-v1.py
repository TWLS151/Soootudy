# 각 방에 처음 들어갔을 때 왼쪽으로 튕겨 나갔다가(+1) 다시 현재 방으로 돌아와(i + 1 - P[i]) 다음 방으로 넘어가는(+1) 과정을 누적 합산한 그리디 풀이


T = int(input())

for tc in range(1, T + 1):
    N = int(input())
    P = list(map(int, input().split()))

    # 1번에서 2번 방으로 이동
    portal_cnt = 1

    # 2번 방(인덱스 1)부터 N-1번 방까지 순회
    for i in range(1, N -1):
        # 현재 방 번호: i + 1
        # 왼쪽 포탈의 목적지 방 번호: P[i]
        
        # 1) 현재 방 첫 진입 시 왼쪽 P[i]로 이동: + 1
        # 2) P[i]에서 현재 방(i+1)까지 다시 복귀하는 횟수: (i + 1) - P[i]
        # 3) 현재 방 재진입 시 오른쪽으로 이동: + 1
        portal_cnt += i + 3 - P[i]

    print(f'#{tc} {portal_cnt}')