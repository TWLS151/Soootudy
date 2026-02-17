'''
# 문제 접근
1. 구현 고민을 왜 해 ? 모든 경우의 수 다 계산해보면 되잖아?
-> 색깔 행 경계 조합을 모두 만들어서, 다 칠해보고 최소값 갱신
2. 색칠하면서 카운트 += 1
'''

T = int(input())

def find_change_area(N): # 1. 색칠 구분점(행 기준)을 찾는 함수

    change_list = []
    for i in range(N-2):
        for j in range(i+1, N-1):
                for k in range(j+1, N):

                    if (j,k) not in change_list:
                        change_list.append((j, k))

    # test : print(f"칠할 수 있는 경우의 수 : {change_list}")

    return change_list

def coloring_grid(arr, change, N, M): # 2. 색칠할 수 있는 모든 경우의 수에 대해 칠할 칸 수를 계산하는 함수

    total = N*M            # 초기값 : 모든 칸을 칠하는 경우의 수로 지정 (N*M)
    
    for b, r in change: # (1) 한 케이스에 대해
        cnt = 0            # 새로운 케이스마다 카운트 초기화

        for i in range(0, b): # (2) W를 칠할 영역을 순회
            for j in range(M):
                if arr[i][j] != 'W': # W가 아닌 칸 발견시마다 카운트 +1
                    cnt += 1

        for i in range(b, r): # (3) B를 칠할 영역을 순회
            for j in range(M):
                if arr[i][j] != 'B':
                    cnt += 1

        for i in range(r, N): # (4) R을 칠할 영역 순회
            for j in range(M):
                if arr[i][j] != 'R':
                    cnt += 1

        # test
        # print(f"현재 칠한 인덱스 : {(b, r)}")
        # print(f"색칠해야 하는 칸 수 : {cnt}")
        # print(f"현재 최소 칸 수 : {total}")
        # print("------------------------------")

        if total > cnt:      # (5) 최솟값 갱신
            total = cnt

    return total

for tc in range(1, T+1):
    n, m = map(int, input().split())

    arr = [list(input()) for _ in range(n)] # 요소 수정을 위해 list로

    color_index = find_change_area(n) # 색칠 구분 행 인덱스 저장

    result = coloring_grid(arr, color_index, n, m)

    print(f"#{tc} {result}")