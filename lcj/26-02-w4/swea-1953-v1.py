'''
저는 여기서 꺾였습니다. 
제 접근법이 DFS였다는 점도 모르고 있어서, 충격먹고 내일부터 DFS/BFS 정확히 구분하겠습니다.

꺾이지만 무너지진 않았다.
꼭 다시 돌아와서 이 문제 죽여버리겠습니다.
'''

'''

# 문제 조건

1. 탈주범은 맨홀 뚜껑에서 출발 - 시간 당 1의 거리 이동
2. 터널 구조물
1 - 상하좌우, 2 - 상하
3 - 좌우, 4 - 상우
5 - 하우, 6 - 하좌
7 - 상좌

3. 소요 시간 L은 1 이상, 20 이하
4. 두 번째 줄 - 세로 N, 가로 M, 맨홀 row, col, 소요시간 L (5개)

# 접근 방법

" 최대로 갈 수 있는 거리를 가면서 좌표를 저장하면, 그곳이 곧 갈 수 있는 모든 위치다."

- 그렇다면, 막다른 길에 도달했을 때는 -> 미리 종료 (Backtracking)

- Stack + 재귀 기반 함수 -> 종료 조건 추가 

1. 함수의 input -> tracking(현재 좌표, 다음 좌표?)

2. 재귀 내의 for문 -> 다음 경우의 수 칸을 불러오기

- (1)if next == 1 -> d = [4방향] 다음 갈 수 있는 델타 (경우의 수) 생성
    - tr = nr += d[0]
    - tc = nc += d[1]

- turnal = [] <- append((tr, tc)) 다음 좌표를 저장

- (2) for di, dj in turnal -> tracking(nr, nc, tr, tc)

- (3) if in_range(tr) and in_range(tc) or t == L: - 종료 조건(가지치기)

- (4) t = 0, 재귀마다 += 1, 상태 복구 시에 -= 1씩

1 - 상하좌우, 2 - 상하
3 - 좌우, 4 - 상우
5 - 하우, 6 - 하좌
7 - 상좌
'''
import sys
sys.stdin = open('input.txt', 'r')


candidate = [] # 다음 후보 방향을 담을 리스트
turnal = [] # 이미 방문한 위치를 담을 리스트
time = 0 # 

def in_range(x, y): # 범위를 파악하는 함수
    return 0 <= x < y

def next_road(row, col):
    
    if arr[row][col] == 1: # 1: 상하좌우
        d = [(-1,0), (1,0), (-1,0), (1,0)]
        return d
        
    elif arr[row][col] == 2: # 2 == 상하
        d = [(-1,0), (1,0)]
        return d
    
    elif arr[row][col] == 3: # 3 == 좌우
        d = [(0,-1), (0, 1)]
        return d
    
    elif arr[row][col] == 4: # 4 == 상우
        d = [(-1,0), (0, 1)]
        return d
        
    elif arr[row][col] == 5: # 5 == 하우
        d = [(1,0), (0, 1)]
        return d
        
    elif arr[row][col] == 6: # 6 == 하좌
        d = [(1,0), (0,-1)]
        return d
        
    elif arr[row][col] == 7: # 7 == 상좌
        d = [(-1,0), (0,-1)]
        return d
    
    else: return False # 0일 경우 -> 함수 종료


def find_run(tr, tc, time):
    
    if in_range(tr, N) and in_range(tc, M) and time < L: # 1-(1) 가지치기 : 범위 내 이동 가능한 거리가 있고, 시간이 남았다면 통과
        return None
    
    if (tr, tc) in turnal: # 1-(2) 가지치기 2 : 이미 방문했던 곳이라면 skip
        return None
        
    # 내려왔다는 건, 시간이 남아있고 가지 않은 후보가 있다 -> 탐색 시작
    
    next_delta = next_road(tr, tc)  # 2. 터널 종류에 따라 다음에 갈 수 있는 영역을 불러오기
    
    time += 1                       # 시간 추가
    turnal.append((tr,tc))          # 좌표 추가
    
                                    # next_delta : 다음 방향 델타 리스트
    for dr, dc in next_delta:       # 갈 수 있는 다음 목적지에 대해
        
        tr += dr                    # 행 좌표 변경 
        tc += dc                    # 열 좌표 변경
        
        ## test
        print(f"다음 살펴볼 좌표 : {(tr, tc)}")
        print(f"현재 시각 : {time}")
        print(f"방문한 좌표 : {turnal}")
        
        find_run(tr, tc)            # 3. 탐색 시작
        
        tr -= dr                    # 4. 탐색 좌표초기화
        tc -= dc
        
        return list(turnal)          

T = int(input()) # Tc

for tc in range(1, 2):
    
    N, M, cr, cc, L = map(int, input().split()) # N x M 배열, (cr, cc) 탈주범, L 소요 시간
    
    arr = [list(map(int, input().split())) for _ in range(N)] # 지도 생성
    
    result = find_run(cr, cc, 0)
    
    print(f"#{tc} {result}")